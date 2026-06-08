import type { AppNode } from "@/types/flow";
import type { ExportResult } from "./types";
import { SERVICE_MAP } from "./node-map";
import {
  isNetworkContainerNode,
  isVpcNode,
  isSubnetNode,
  isRegionNode,
  isAzNode,
} from "@/lib/graph-utils";

type Fields = Record<string, string | boolean | number | undefined>;
type HclRef = { __ref: string };

function hclRef(expr: string): HclRef {
  return { __ref: expr };
}

function hclValue(v: unknown, depth = 1): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  if (typeof v === "object" && "__ref" in (v as object)) return (v as HclRef).__ref;
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    const items = v.map((item) => hclValue(item, depth + 1));
    if (typeof v[0] === "object" && v[0] !== null && !("__ref" in (v[0] as object))) {
      const pad = "  ".repeat(depth);
      const inner = items.join(",\n" + pad);
      return `[\n${pad}${inner}\n${"  ".repeat(depth - 1)}]`;
    }
    return `[${items.join(", ")}]`;
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>).filter(
      ([, val]) => val !== undefined && val !== null,
    );
    if (entries.length === 0) return "{}";
    const pad = "  ".repeat(depth);
    const lines = entries.map(([k, val]) => `${pad}${k} = ${hclValue(val, depth + 1)}`);
    return `{\n${lines.join("\n")}\n${"  ".repeat(depth - 1)}}`;
  }
  return String(v);
}

function resourceBlock(
  resourceType: string,
  resourceName: string,
  attrs: Record<string, unknown>,
): string {
  const lines: string[] = [`resource "${resourceType}" "${resourceName}" {`];
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      !("__ref" in (value as object))
    ) {
      const entries = Object.entries(value as Record<string, unknown>).filter(
        ([, v]) => v !== undefined && v !== null,
      );
      if (entries.length === 0) continue;
      lines.push(`\n  ${key} {`);
      for (const [k, v] of entries) {
        if (v === undefined || v === null) continue;
        if (
          typeof v === "object" &&
          !Array.isArray(v) &&
          !("__ref" in (v as object))
        ) {
          lines.push(`    ${k} {`);
          for (const [k2, v2] of Object.entries(
            v as Record<string, unknown>,
          )) {
            if (v2 !== undefined && v2 !== null)
              lines.push(`      ${k2} = ${hclValue(v2, 4)}`);
          }
          lines.push(`    }`);
        } else {
          lines.push(`    ${k} = ${hclValue(v, 3)}`);
        }
      }
      lines.push(`  }`);
    } else if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "object" &&
      !("__ref" in (value[0] as object))
    ) {
      for (const item of value as Record<string, unknown>[]) {
        const entries = Object.entries(item).filter(
          ([, v]) => v !== undefined && v !== null,
        );
        if (entries.length === 0) continue;
        lines.push(`\n  ${key} {`);
        for (const [k, v] of entries) {
          if (v === undefined || v === null) continue;
          lines.push(`    ${k} = ${hclValue(v, 3)}`);
        }
        lines.push(`  }`);
      }
    } else {
      lines.push(`  ${key} = ${hclValue(value)}`);
    }
  }
  lines.push("}");
  return lines.join("\n");
}

function tagsBlock(name: string): string {
  return `  tags = {\n    Name = ${hclValue(name)}\n  }`;
}

function sanitizeTfId(nodeId: string, prefix: string): string {
  const clean = nodeId.replace(/[^a-zA-Z0-9]/g, "_").replace(/^[^a-zA-Z]/, "_");
  const short = clean.slice(-12).replace(/^_+/, "") || "node";
  return `${prefix}_${short}`;
}

function getNodeFields(node: AppNode): Fields {
  return ((node.data as { fields?: Fields }).fields ?? {}) as Fields;
}

function getNodeLabel(node: AppNode): string {
  const data = node.data as {
    label?: string;
    name?: string;
    fields?: { label?: string };
  };
  return data.label ?? data.name ?? data.fields?.label ?? "node";
}

function findAncestorOfType(
  nodeId: string,
  check: (n: AppNode) => boolean,
  byId: Map<string, AppNode>,
): AppNode | undefined {
  const node = byId.get(nodeId);
  if (!node || !node.parentId) return undefined;
  const parent = byId.get(node.parentId);
  if (!parent) return undefined;
  if (check(parent)) return parent;
  return findAncestorOfType(node.parentId, check, byId);
}

/** Returns the AZ label if it looks like a real AWS AZ identifier (e.g. "us-east-1a"). */
function getAzLabel(nodeId: string, byId: Map<string, AppNode>): string | undefined {
  const az = findAncestorOfType(nodeId, isAzNode, byId);
  if (!az) return undefined;
  const label = getNodeLabel(az);
  return /^[a-z]{2}-[a-z]+-\d+[a-z]$/.test(label) ? label : undefined;
}

/** Returns the AWS region code from the nearest Region ancestor node, or undefined. */
function getRegionForNode(nodeId: string, byId: Map<string, AppNode>): string | undefined {
  const region = findAncestorOfType(nodeId, isRegionNode, byId);
  if (!region) return undefined;
  const f = getNodeFields(region);
  return String(f.region ?? "us-east-1");
}

/** Converts a region code to a valid Terraform provider alias (e.g. "eu-west-1" → "eu_west_1"). */
function regionAlias(region: string): string {
  return region.replace(/-/g, "_");
}

const HEADER_DISCLAIMER = `# =============================================================================
# Generated by AWS Architecture Visualizer
#
# DISCLAIMER: This is a starting-point scaffold. Values marked REPLACE_ME
# must be filled in before applying. Review every resource carefully and
# test in a non-production environment first. The authors accept no
# responsibility for infrastructure changes resulting from this template.
# =============================================================================
`;

function buildHeader(regions: string[]): string {
  const primary = regions[0] ?? "us-east-1";
  const extras = regions.slice(1);

  let header = HEADER_DISCLAIMER + `
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "${primary}"
}
`;

  for (const r of extras) {
    header += `
provider "aws" {
  alias  = "${regionAlias(r)}"
  region = "${r}"
}
`;
  }

  return header;
}

function section(title: string): string {
  const bar = "─".repeat(Math.max(0, 77 - title.length));
  return `\n# ─── ${title} ${bar}\n`;
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateTerraform(nodes: AppNode[]): ExportResult {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Collect unique AWS regions from Region container nodes
  const regionNodes = nodes.filter(isRegionNode);
  const uniqueRegions: string[] = [];
  const seenRegions = new Set<string>();
  for (const rn of regionNodes) {
    const code = String(getNodeFields(rn).region ?? "us-east-1");
    if (!seenRegions.has(code)) {
      seenRegions.add(code);
      uniqueRegions.push(code);
    }
  }

  const parts: string[] = [buildHeader(uniqueRegions)];
  const multiRegion = uniqueRegions.length > 1;

  // 1. VPCs (networkContainer containerType="vpc")
  const vpcs = nodes.filter((n) => isVpcNode(n));
  if (vpcs.length > 0) {
    parts.push(section("VPCs"));
    for (const vpc of vpcs) {
      const id = sanitizeTfId(vpc.id, "vpc");
      const fields = getNodeFields(vpc);
      const cidr = String(fields.cidrBlock ?? "10.0.0.0/16");

      const attrs: Record<string, unknown> = {
        cidr_block: cidr,
        enable_dns_support: true,
        enable_dns_hostnames: true,
      };

      // Attach provider alias for multi-region diagrams
      if (multiRegion) {
        const vpcRegion = getRegionForNode(vpc.id, byId);
        if (vpcRegion && vpcRegion !== uniqueRegions[0]) {
          attrs.provider = hclRef(`aws.${regionAlias(vpcRegion)}`);
        }
      }

      const block = resourceBlock("aws_vpc", id, attrs);
      parts.push(block.replace(/\n}$/, "") + "\n" + tagsBlock(getNodeLabel(vpc)) + "\n}");
    }
  }

  // 2. Subnets (networkContainer containerType="subnet")
  const subnets = nodes.filter((n) => isSubnetNode(n));
  if (subnets.length > 0) {
    parts.push(section("Subnets"));
    let subnetIdx = 1;
    for (const subnet of subnets) {
      const id = sanitizeTfId(subnet.id, "subnet");
      const fields = getNodeFields(subnet);
      const data = subnet.data as { subnetType?: string; cidrBlock?: string };
      const cidr = String(
        fields.cidrBlock ?? data.cidrBlock ?? `10.0.${subnetIdx}.0/24`,
      );
      const isPublic =
        (subnet.data as { subnetType?: string }).subnetType === "Public";

      const vpcAncestor = findAncestorOfType(subnet.id, isVpcNode, byId);
      const vpcRef = vpcAncestor
        ? hclRef(`aws_vpc.${sanitizeTfId(vpcAncestor.id, "vpc")}.id`)
        : "REPLACE_ME";

      const azLabel = getAzLabel(subnet.id, byId);

      const attrs: Record<string, unknown> = {
        vpc_id: vpcRef,
        cidr_block: cidr,
        map_public_ip_on_launch: isPublic,
        ...(azLabel ? { availability_zone: azLabel } : {}),
      };

      // Propagate provider alias for multi-region diagrams
      if (multiRegion) {
        const subnetRegion = getRegionForNode(subnet.id, byId);
        if (subnetRegion && subnetRegion !== uniqueRegions[0]) {
          attrs.provider = hclRef(`aws.${regionAlias(subnetRegion)}`);
        }
      }

      const block = resourceBlock("aws_subnet", id, attrs);
      parts.push(block.replace(/\n}$/, "") + "\n" + tagsBlock(getNodeLabel(subnet)) + "\n}");
      subnetIdx++;
    }
  }

  // 3. AWS service nodes
  const serviceNodes = nodes.filter(
    (n) => (n.type === "awsService" || n.type === "gatewayService") && !isNetworkContainerNode(n),
  );

  const byServiceId: Map<string, AppNode[]> = new Map();
  for (const node of serviceNodes) {
    const serviceId = String(
      (node.data as { serviceId?: string }).serviceId ?? "",
    );
    if (!serviceId) continue;
    const list = byServiceId.get(serviceId) ?? [];
    list.push(node);
    byServiceId.set(serviceId, list);
  }

  // Group by terraform resource type for section headers
  const processedResourceTypes = new Set<string>();
  const orderedServiceIds = [...byServiceId.keys()];

  for (const serviceId of orderedServiceIds) {
    const map = SERVICE_MAP[serviceId];

    // Resolve dynamic terraform resource type
    const fields0 = getNodeFields(byServiceId.get(serviceId)![0]);
    const rawTf = map?.terraform;
    const tfType =
      rawTf == null
        ? null
        : typeof rawTf === "function"
          ? rawTf(fields0)
          : rawTf;

    const label = tfType ?? serviceId;

    if (!processedResourceTypes.has(label)) {
      processedResourceTypes.add(label);
      const title = tfType
        ? tfType.replace(/^aws_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : serviceId.toUpperCase();
      parts.push(section(title));
    }

    const svcNodes = byServiceId.get(serviceId)!;
    for (const node of svcNodes) {
      const resourceName = sanitizeTfId(node.id, serviceId.replace(/-/g, "_"));
      const fields = getNodeFields(node);

      // Resolve per-node terraform type (in case tfProps differs per node)
      const resolvedTfType =
        rawTf == null
          ? null
          : typeof rawTf === "function"
            ? rawTf(fields)
            : rawTf;

      if (!resolvedTfType) {
        parts.push(
          `# ${serviceId} — no direct Terraform resource mapping available\n` +
            `# Service: ${getNodeLabel(node)}\n`,
        );
        continue;
      }

      const serviceProps = map.tfProps ? map.tfProps(fields) : {};

      // Location injection — use cfLocation / tfLocation declared in SERVICE_MAP
      const tfLoc = map?.tfLocation;
      const locationProps: Record<string, unknown> = {};

      if (tfLoc && tfLoc !== "none") {
        if (tfLoc === "subnet_id") {
          const subnetAncestor = findAncestorOfType(node.id, isSubnetNode, byId);
          if (subnetAncestor) {
            locationProps.subnet_id = hclRef(
              `aws_subnet.${sanitizeTfId(subnetAncestor.id, "subnet")}.id`,
            );
          }
        } else if (tfLoc === "vpc_id") {
          const vpcAncestor = findAncestorOfType(node.id, isVpcNode, byId);
          if (vpcAncestor) {
            locationProps.vpc_id = hclRef(
              `aws_vpc.${sanitizeTfId(vpcAncestor.id, "vpc")}.id`,
            );
          }
        } else if (tfLoc === "availability_zone") {
          const azVal = getAzLabel(node.id, byId);
          if (azVal) locationProps.availability_zone = azVal;
        }
      }

      // Multi-region provider reference
      const providerProps: Record<string, unknown> = {};
      if (multiRegion) {
        const nodeRegion = getRegionForNode(node.id, byId);
        if (nodeRegion && nodeRegion !== uniqueRegions[0]) {
          providerProps.provider = hclRef(`aws.${regionAlias(nodeRegion)}`);
        }
      }

      const allProps: Record<string, unknown> = {
        ...providerProps,
        ...serviceProps,
        ...locationProps,
      };

      const block = resourceBlock(resolvedTfType, resourceName, allProps);
      const withTags =
        block.replace(/\n}$/, "") + "\n" + tagsBlock(getNodeLabel(node)) + "\n}";
      parts.push(withTags);
    }
  }

  return {
    content: parts.join("\n"),
    filename: "main.tf",
    mimeType: "text/plain",
  };
}
