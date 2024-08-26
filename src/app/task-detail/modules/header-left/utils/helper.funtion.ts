export function updateReturnUrlBasedOnTab(
  returnUrl: string,
  tab: string
): string {
  const tabStatusMap = {
    OPEN: { message: 'all', status: 'INPROGRESS' },
    DRAFT: { message: 'draft', status: 'DRAFT' },
    RESOLVED: { message: 'resolved', status: 'COMPLETED' },
    DELETED: { message: 'deleted', status: 'DELETED' }
  };

  if (returnUrl.includes('eventId')) {
    const baseUrl = returnUrl.split('?')[0];
    const queryParams = returnUrl.split('?')[1];
    const updatedParams = queryParams?.replace(/&?eventId=[^&]*/g, '') || '';
    returnUrl = `${baseUrl}?${updatedParams}`;
  }

  if (tab && tabStatusMap[tab]) {
    const { message, status } = tabStatusMap[tab];
    const url = new URL(returnUrl, window.location.origin);
    url.pathname = url.pathname.replace(
      /(\/(?:messages|app-messages|voicemail-messages)\/)[^?]*/,
      `$1${message}`
    );
    url.searchParams.set('status', status);
    returnUrl = url.pathname + url.search;
  }

  return returnUrl;
}

export function removeSelectedSideNav() {
  const iconList = Array.from(
    document.getElementsByClassName('inbox-sub-item')
  );
  iconList.forEach((icon) => {
    icon.classList.remove('nav-item--selected');
  });
}
