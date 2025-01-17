type message = {
  data: any;
  status?: 0 | 0.5 | 1;
  error?: string;
};

declare global {
  type message = message;
}
