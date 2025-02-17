export type TaskDialogConfig = {
  // A title within the header.
  title?: string;
  // An image displayed within the header.
  icon?: string;
  // Width of the dialog (in px or percent).
  width?: string;
  // Set to `false` to do not automatically scroll down the
  // content. Defaults to `true`.
  autoScroll?: boolean;
  // Start the action on dialog initialization. If set to `true`,
  // then the 'Start' button gets hidden. Defaults to `false`.
  startOnInit?: boolean;
  // The button configurations.
  // The defaults are:
  // - start:
  //   - The button text defaults to `Start`.
  //   - The button is visible by default. The button gets hidden
  //     automatically if `startOnInit` is set to `true`.
  //   - The button is not disabled by default.
  //   - The button is not focused by default.
  // - stop:
  //   - The button text defaults to `Stop`.
  //   - The button is visible by default.
  //   - The button is disabled by default.
  //   - The button is not focused by default.
  // - close:
  //   - The button text defaults to `Close`.
  //   - The button is visible by default.
  //   - The button is disabled by default.
  //   - The button is focused by default.
  //   - The value submitted when the dialog gets closed defaults
  //     to `false`.
  buttons?: {
    start?: TaskDialogButtonConfig;
    stop?: TaskDialogButtonConfig;
    close?: TaskDialogButtonConfig;
  };
  request?: {
    // The name of the RPC service.
    service: string;
    // The name of the RPC. Note, this MUST be implemented as
    // background task.
    method: string;
    // Additional parameters.
    params?: Record<string, any>;
  };
};

export type TaskDialogButtonConfig = {
  // The text displayed in the button.
  text?: string;
  // Is the button hidden?
  hidden?: boolean;
  // Is the button disabled?
  disabled?: boolean;
  // Is the button auto-focused?
  autofocus?: boolean;
  // The dialog close input. This can be a boolean, string or
  // anything else.
  dialogResult?: any;
};
