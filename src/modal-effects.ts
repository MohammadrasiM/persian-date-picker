type Modal = {
  root: HTMLElement;
  panel: HTMLElement;
  dismiss: () => void;
};

type ModalState = {
  stack: Modal[];
  updateBackground: () => void;
  dispose: () => void;
};

const documents = new WeakMap<Document, ModalState>();
const focusableSelector =
  'button, [href], input, select, textarea, [tabindex], [contenteditable="true"]';

function focusableElements(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => {
    if (
      element.tabIndex < 0 ||
      element.matches(':disabled, input[type="hidden"]') ||
      element.closest('[inert], [hidden], [aria-hidden="true"]')
    )
      return false;
    for (
      let parent: HTMLElement | null = element;
      parent && parent !== panel.parentElement;
      parent = parent.parentElement
    ) {
      const style = element.ownerDocument.defaultView!.getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none")
        return false;
    }
    return true;
  });
}

function focusFirst(panel: HTMLElement) {
  (focusableElements(panel)[0] ?? panel).focus({ preventScroll: true });
}

function createModalState(document: Document): ModalState {
  const body = document.body;
  const view = document.defaultView!;
  const background = new Map<Element, { inert: string | null; hidden: string | null }>();
  const styles = [
    { element: body, property: "overflow" },
    { element: document.documentElement, property: "overflow" },
    { element: body, property: "padding-right" },
  ].map(({ element, property }) => ({
    element,
    property,
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  }));
  const scrollbar = document.documentElement.clientWidth
    ? Math.max(0, view.innerWidth - document.documentElement.clientWidth)
    : 0;
  if (scrollbar) {
    const padding = parseFloat(view.getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${padding + scrollbar}px`;
  }
  body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";

  const state: ModalState = { stack: [], updateBackground() {}, dispose() {} };
  const top = () => state.stack[state.stack.length - 1];
  const restoreAttribute = (element: Element, name: string, value: string | null) => {
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  };
  state.updateBackground = () => {
    for (const element of Array.from(body.children)) {
      if (!background.has(element)) {
        background.set(element, {
          inert: element.getAttribute("inert"),
          hidden: element.getAttribute("aria-hidden"),
        });
      }
    }
    const active = top();
    if (active) {
      const original = background.get(active.root)!;
      restoreAttribute(active.root, "inert", original.inert);
      restoreAttribute(active.root, "aria-hidden", original.hidden);
      if (!active.panel.contains(document.activeElement)) focusFirst(active.panel);
    }
    for (const element of Array.from(body.children)) {
      const original = background.get(element)!;
      if (element === active?.root) {
        restoreAttribute(element, "inert", original.inert);
        restoreAttribute(element, "aria-hidden", original.hidden);
      } else {
        element.setAttribute("inert", "");
        element.setAttribute("aria-hidden", "true");
      }
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const modal = top();
    if (!modal) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) modal.dismiss();
    } else if (event.key === "Tab") {
      const elements = focusableElements(modal.panel);
      const first = elements[0] ?? modal.panel;
      const last = elements[elements.length - 1] ?? modal.panel;
      const outside = !modal.panel.contains(document.activeElement);
      if (!elements.length || outside || document.activeElement === (event.shiftKey ? first : last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      }
    }
  };
  const onFocus = (event: FocusEvent) => {
    const modal = top();
    if (modal && !modal.panel.contains(event.target as Node)) focusFirst(modal.panel);
  };
  let pointerStart: { modal: Modal; outside: boolean } | undefined;
  const onPointerDown = (event: PointerEvent) => {
    const modal = top();
    pointerStart =
      modal && event.button === 0
        ? { modal, outside: !modal.panel.contains(event.target as Node) }
        : undefined;
  };
  const onPointerCancel = () => {
    pointerStart = undefined;
  };
  const onClick = (event: MouseEvent) => {
    const modal = top();
    const start = pointerStart;
    pointerStart = undefined;
    if (
      modal &&
      start?.modal === modal &&
      start.outside &&
      !modal.panel.contains(event.target as Node)
    ) {
      event.preventDefault();
      event.stopPropagation();
      modal.dismiss();
    }
  };
  const observer = new MutationObserver(state.updateBackground);
  observer.observe(body, { childList: true });
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("focusin", onFocus, true);
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("pointercancel", onPointerCancel, true);
  document.addEventListener("click", onClick, true);
  state.dispose = () => {
    observer.disconnect();
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("focusin", onFocus, true);
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("pointercancel", onPointerCancel, true);
    document.removeEventListener("click", onClick, true);
    for (const [element, original] of background) {
      restoreAttribute(element, "inert", original.inert);
      restoreAttribute(element, "aria-hidden", original.hidden);
    }
    for (const { element, property, value, priority } of styles) {
      if (value) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
    }
  };
  return state;
}

export function manageModal(root: HTMLElement, panel: HTMLElement, dismiss: () => void) {
  const document = root.ownerDocument;
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let state = documents.get(document);
  if (!state) {
    state = createModalState(document);
    documents.set(document, state);
  }
  const modal = { root, panel, dismiss };
  state.stack.push(modal);
  state.updateBackground();
  focusFirst(panel);
  return () => {
    const wasTop = state.stack[state.stack.length - 1] === modal;
    state.stack.splice(state.stack.indexOf(modal), 1);
    if (state.stack.length) state.updateBackground();
    else {
      state.dispose();
      documents.delete(document);
    }
    if (wasTop) {
      if (opener?.isConnected && !opener.closest("[inert]")) opener.focus({ preventScroll: true });
      const active = state.stack[state.stack.length - 1];
      if (active && !active.panel.contains(document.activeElement)) focusFirst(active.panel);
    }
  };
}
