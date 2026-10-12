export function safeRequestLog(request:{method:string;url:string}) {
  const path=request.url.split(/[?#]/,1)[0]??'/';
  // Route-shaped diagnostics retain utility without admitting public join tokens.
  const url=path.replace(/(\/(?:api\/)?(?:join|invitations?|invite)\/)[^/]+/g,'$1[REDACTED]');
  return {method:request.method,url};
}
