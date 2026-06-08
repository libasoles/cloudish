import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

type Options = {
  branch?: string;
  overwriteEnv: boolean;
  path?: string;
  skipInstall: boolean;
  slug?: string;
};

const USAGE = `Usage:
  npm run worktree:create -- <slug> [--path <path>] [--branch <branch>] [--skip-install] [--overwrite-env]

Examples:
  npm run worktree:create -- my-feature
  npm run worktree:create -- my-feature --path ../cloudish-custom --branch feat/custom
`;

function parseArgs(args: string[]): Options {
  const options: Options = {
    overwriteEnv: false,
    skipInstall: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      console.log(USAGE);
      process.exit(0);
    }

    if (arg === "--skip-install") {
      options.skipInstall = true;
      continue;
    }

    if (arg === "--overwrite-env") {
      options.overwriteEnv = true;
      continue;
    }

    if (arg === "--path") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("Missing value for --path.");
      }

      options.path = value;
      index += 1;
      continue;
    }

    if (arg === "--branch") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("Missing value for --branch.");
      }

      options.branch = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (options.slug) {
      throw new Error(`Unexpected extra argument: ${arg}`);
    }

    options.slug = arg;
  }

  if (!options.slug) {
    throw new Error("Missing worktree slug.");
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(options.slug)) {
    throw new Error("Slug must use lowercase letters, numbers, and hyphens.");
  }

  return options;
}

function runGit(args: string[], cwd: string): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function branchExists(branch: string, cwd: string): boolean {
  const result = spawnSync("git", ["rev-parse", "--verify", "--quiet", branch], {
    cwd,
    stdio: "ignore",
  });

  return result.status === 0;
}

function isIgnoredByGit(fileName: string, cwd: string): boolean {
  const result = spawnSync("git", ["check-ignore", "--quiet", "--", fileName], {
    cwd,
    stdio: "ignore",
  });

  return result.status === 0;
}

function resolveTargetPath(sourceRoot: string, rawPath: string): string {
  if (isAbsolute(rawPath)) {
    return rawPath;
  }

  return resolve(sourceRoot, rawPath);
}

function getLocalEnvFiles(sourceRoot: string): string[] {
  return readdirSync(sourceRoot).filter((fileName) => {
    if (!fileName.startsWith(".env")) {
      return false;
    }

    if (fileName === ".env.example") {
      return false;
    }

    return (
      statSync(join(sourceRoot, fileName)).isFile() &&
      isIgnoredByGit(fileName, sourceRoot)
    );
  });
}

function copyEnvFiles(sourceRoot: string, targetRoot: string, overwrite: boolean) {
  const envFiles = getLocalEnvFiles(sourceRoot);

  if (envFiles.length === 0) {
    console.log("No local .env* files found to copy.");
    return;
  }

  for (const fileName of envFiles) {
    const sourcePath = join(sourceRoot, fileName);
    const targetPath = join(targetRoot, fileName);

    if (existsSync(targetPath) && !overwrite) {
      console.log(`Skipped ${fileName}; it already exists in the worktree.`);
      continue;
    }

    copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${fileName}.`);
  }
}

function runNpmInstall(targetRoot: string) {
  const result = spawnSync("npm", ["install"], {
    cwd: targetRoot,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error("npm install failed in the new worktree.");
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const sourceRoot = runGit(["rev-parse", "--show-toplevel"], process.cwd());
  const defaultPath = join(dirname(sourceRoot), `cloudish-${options.slug}`);
  const targetPath = resolveTargetPath(sourceRoot, options.path ?? defaultPath);
  const branch = options.branch ?? `feat/${options.slug}`;

  if (existsSync(targetPath)) {
    throw new Error(`Target path already exists: ${targetPath}`);
  }

  if (branchExists(branch, sourceRoot)) {
    throw new Error(`Branch already exists: ${branch}`);
  }

  console.log(`Creating worktree ${targetPath} on ${branch}...`);
  const worktreeResult = spawnSync(
    "git",
    ["worktree", "add", targetPath, "-b", branch],
    {
      cwd: sourceRoot,
      stdio: "inherit",
    },
  );

  if (worktreeResult.status !== 0) {
    throw new Error("git worktree add failed.");
  }

  if (!existsSync(targetPath)) {
    throw new Error("git worktree add did not create the target path.");
  }

  copyEnvFiles(sourceRoot, targetPath, options.overwriteEnv);

  if (options.skipInstall) {
    console.log("Skipped npm install.");
  } else {
    runNpmInstall(targetPath);
  }

  console.log(`Worktree ready: ${targetPath}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  console.error("");
  console.error(USAGE);
  process.exit(1);
}
