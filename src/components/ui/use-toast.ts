import * as React from "react";
import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type Toast = Omit<ToasterToast, "id">;

type State = {
  toasts: ToasterToast[];
};

const actionTypes = {
  addToast: "ADD_TOAST",
  updateToast: "UPDATE_TOAST",
  dismissToast: "DISMISS_TOAST",
  removeToast: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | {
      type: typeof actionTypes.addToast;
      toast: ToasterToast;
    }
  | {
      type: typeof actionTypes.updateToast;
      toast: Partial<ToasterToast>;
    }
  | {
      type: typeof actionTypes.dismissToast;
      toastId?: ToasterToast["id"];
    }
  | {
      type: typeof actionTypes.removeToast;
      toastId?: ToasterToast["id"];
    };

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.removeToast,
      toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case actionTypes.addToast:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.updateToast:
      return {
        ...state,
        toasts: state.toasts.map((toast) => {
          if (toast.id !== action.toast.id) {
            return toast;
          }

          return { ...toast, ...action.toast };
        }),
      };

    case actionTypes.dismissToast: {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((toast) => {
          if (toast.id !== toastId && toastId !== undefined) {
            return toast;
          }

          return {
            ...toast,
            open: false,
          };
        }),
      };
    }

    case actionTypes.removeToast:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }

      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.toastId),
      };
  }
}

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.updateToast,
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: actionTypes.dismissToast, toastId: id });

  dispatch({
    type: actionTypes.addToast,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);

    return () => {
      const index = listeners.indexOf(setState);

      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: actionTypes.dismissToast, toastId }),
  };
}

export { toast, useToast };
