document.addEventListener('DOMContentLoaded', function () {
    const primaryButton = document.querySelector('.nav-button');
    const bottomButton = document.querySelector('.material-icons');

    function savePreviousPage() {
        const currentPage = window.location.href.split('?')[0];
        const previousPage = document.referrer;
        if (previousPage && !previousPage.includes(currentPage)) {
            localStorage.setItem('previousPage', previousPage);
            const newUrl = new URL(currentPage);
            newUrl.searchParams.set('from', encodeURIComponent(previousPage));
            window.history.replaceState({}, '', newUrl);
        }
    }

    function getPreviousPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const fromParam = urlParams.get('from');
        if (fromParam) {
            return decodeURIComponent(fromParam);
        }
        return localStorage.getItem('previousPage') || '/';
    }

    function goBack(event) {
        event.preventDefault();
        const previousPage = getPreviousPage();
        window.location.href = previousPage;
    }

    // Save the previous page when the page loads
    savePreviousPage();

    if (primaryButton) {
        primaryButton.addEventListener('click', goBack);
    }

    if (bottomButton) {
        bottomButton.addEventListener('click', goBack);
    }

    if (!primaryButton && !bottomButton) {
        console.error('Go Back button not found!');
    }
});