function setOverlayVisible(visible) {
    let $overlay = $('#overlay');
    let $button = $('#restart');

    $overlay.toggleClass('overlay-visible', visible);

    $button.click(function (e) {
        location.reload();
    });
}


