window.clickOutsideTooltip = function(event) {
    let el = event.target;
    let selection = window.getSelection().toString();
    if (selection && selection.trim().length) {
        return;
    }
    while(el.parentNode) {
        if (el.classList.contains('rev-tooltip')) {

            let zIndex = Number(el.dataset.z);
            let others = tooltips();
            let toRemove = [];
            for (let ot of others) {
                if (Number(ot.dataset.z) > zIndex) {
                    toRemove.push(ot)
                }
            }
            for (let el of toRemove) {
                el.remove();
            }
            if (window.REV_SEARCH_SHOULD_BLUR) {
                blurLowerTooltips();
            }
            return;
        }
        el = el.parentNode;
    }
    let existingTooltips = Array.from(document.getElementsByClassName('rev-tooltip'));
    for (let el of existingTooltips) {
        el.remove();
    }

    document.removeEventListener('click', clickOutsideTooltip);

};
window.tooltips = function() {
    return document.getElementsByClassName('rev-tooltip');
};
window.maxZ = function() {
    let els = tooltips();
    let highestZ = 0;
    for (let el of els) {
        let z = Number(el.dataset.z);
        if (z > highestZ) {
            highestZ = z;
        }
    }
    return highestZ;
};
window.blurLowerTooltips = function() {
    let highestZ = maxZ();
    let els = tooltips();
    for (let el of els) {
        if (Number(el.dataset.z) < highestZ) {
            el.style.filter = 'blur(1px)';
        } else {
            el.style.filter = 'none';
        }
    }
};
window.tooltipSearch = function(tooltipId, query) {
    if (!query || !query.trim().length) {
        setTooltipSearchResults(tooltipId, []);
        return;
    }
    pycmd('rev-search ' + tooltipId + ' ' + query);
};
window.renderNewTooltip = function(query) {

    let sel = window.getSelection();
    if (!sel) {
        return;
    }
    window._revTooltipIdCount++;
    let id = window._revTooltipIdCount;
    let srange = sel.getRangeAt(0);
    let sbox = srange.getBoundingClientRect();

    let tooltip = document.createElement('div');
    tooltip.classList.add('rev-tooltip');
    let scroll = document.scrollingElement.scrollTop;
    tooltip.style.left = sbox.left + 'px';
    if (window.innerHeight - sbox.bottom < 470) {
        // place tooltip above selection
        tooltip.style.bottom = (window.innerHeight - sbox.top - scroll) + 'px';
    } else {
        // place tooltip under selection
        tooltip.style.top = (sbox.bottom + scroll) + 'px';
    }
    tooltip.id = 'rev-tooltip_' + id;


    let loader = query.length < REV_SEARCH_MAX_QUERY_LENGTH ? "Searching ..." : "Sorry, query is too long.";
    tooltip.innerHTML = `<div class='rev-tooltip__search'>
                            <svg class='rev-tooltip__search_icn' width="24" height="24" viewBox="0 0 24 24" fill="none" > <path fill-rule="evenodd" clip-rule="evenodd" d="M18.319 14.4326C20.7628 11.2941 20.542 6.75347 17.6569 3.86829C14.5327 0.744098 9.46734 0.744098 6.34315 3.86829C3.21895 6.99249 3.21895 12.0578 6.34315 15.182C9.22833 18.0672 13.769 18.2879 16.9075 15.8442C16.921 15.8595 16.9351 15.8745 16.9497 15.8891L21.1924 20.1317C21.5829 20.5223 22.2161 20.5223 22.6066 20.1317C22.9971 19.7412 22.9971 19.1081 22.6066 18.7175L18.364 14.4749C18.3493 14.4603 18.3343 14.4462 18.319 14.4326ZM16.2426 5.28251C18.5858 7.62565 18.5858 11.4246 16.2426 13.7678C13.8995 16.1109 10.1005 16.1109 7.75736 13.7678C5.41421 11.4246 5.41421 7.62565 7.75736 5.28251C10.1005 2.93936 13.8995 2.93936 16.2426 5.28251Z" fill="currentColor" /> </svg>
                            <input type='text' id='rev-tooltip__search_${id}' 
                                onkeyup='tooltipSearch(${id}, this.value)' onmouseup='event.preventDefault(); event.stopPropagation();' onclick='event.preventDefault(); event.stopPropagation();' placeholder='Search'/>
                        </div>
                        <div class='rev-tooltip__scroll' id='rev-tooltip__scroll_${id}'>${loader}</div>
                        <div class='rev-tooltip__bottom' onmouseup='onTooltipBottomBarMouseup(event)'>
                            <svg class='rev-tooltip__zoom' onclick='tooltipZoomIn(event, ${id})' width="15" height="15" viewBox="0 0 24 24" fill="none" > <path fill-rule="evenodd" clip-rule="evenodd" d="M15.3431 15.2426C17.6863 12.8995 17.6863 9.1005 15.3431 6.75736C13 4.41421 9.20101 4.41421 6.85786 6.75736C4.51472 9.1005 4.51472 12.8995 6.85786 15.2426C9.20101 17.5858 13 17.5858 15.3431 15.2426ZM16.7574 5.34315C19.6425 8.22833 19.8633 12.769 17.4195 15.9075C17.4348 15.921 17.4498 15.9351 17.4645 15.9497L21.7071 20.1924C22.0976 20.5829 22.0976 21.2161 21.7071 21.6066C21.3166 21.9971 20.6834 21.9971 20.2929 21.6066L16.0503 17.364C16.0356 17.3493 16.0215 17.3343 16.008 17.319C12.8695 19.7628 8.32883 19.542 5.44365 16.6569C2.31946 13.5327 2.31946 8.46734 5.44365 5.34315C8.56785 2.21895 13.6332 2.21895 16.7574 5.34315ZM10.1005 7H12.1005V10H15.1005V12H12.1005V15H10.1005V12H7.10052V10H10.1005V7Z" fill="currentColor" /> </svg>
                            <svg class='rev-tooltip__zoom' onclick='tooltipZoomOut(event, ${id})'  width="15" height="15" viewBox="0 0 24 24" fill="none" > <path fill-rule="evenodd" clip-rule="evenodd" d="M15.3431 15.2426C17.6863 12.8995 17.6863 9.1005 15.3431 6.75736C13 4.41421 9.20101 4.41421 6.85786 6.75736C4.51472 9.1005 4.51472 12.8995 6.85786 15.2426C9.20101 17.5858 13 17.5858 15.3431 15.2426ZM16.7574 5.34315C19.6425 8.22833 19.8633 12.769 17.4195 15.9075C17.4348 15.921 17.4498 15.9351 17.4645 15.9497L21.7071 20.1924C22.0976 20.5829 22.0976 21.2161 21.7071 21.6066C21.3166 21.9971 20.6834 21.9971 20.2929 21.6066L16.0503 17.364C16.0356 17.3493 16.0215 17.3343 16.008 17.319C12.8695 19.7628 8.32883 19.542 5.44365 16.6569C2.31946 13.5327 2.31946 8.46734 5.44365 5.34315C8.56785 2.21895 13.6332 2.21895 16.7574 5.34315ZM7.10052 10V12H15.1005V10L7.10052 10Z" fill="currentColor" /> </svg>
                            <svg class='rev-tooltip__resize' onmousedown='initResize(event, ${id})' width="15" height="15" viewBox="0 0 24 24" fill="none"> <path d="M10.1005 2.10052V4.10052H5.51471L11.293 9.87878L9.87875 11.293L4.10046 5.51471L4.10046 10.1005H2.10046L2.10046 2.10052H10.1005Z" fill="currentColor" /> <path d="M21.8995 13.8995H19.8995V18.4853L14.1212 12.707L12.707 14.1213L18.4853 19.8995H13.8995V21.8995H21.8995V13.8995Z" fill="currentColor" /> <path d="M16.2426 9.1716L14.8284 7.75739L7.7573 14.8285L9.17151 16.2427L16.2426 9.1716Z" fill="currentColor" /></svg>
                        </div>
                        `;
    let highestZ = maxZ();
    tooltip.style.zIndex = highestZ + 1;
    tooltip.dataset.z = highestZ + 1;

    document.body.appendChild(tooltip);
    if (highestZ > 0 && REV_SEARCH_SHOULD_BLUR) {
        blurLowerTooltips();
    }
    if (query.length < REV_SEARCH_MAX_QUERY_LENGTH) {
        let afterRender = () => {
            let searchInp = document.getElementById('rev-tooltip__search_'+ id);
            if (!searchInp) {
                setTimeout(afterRender, 20);
                return;
            }
            searchInp.value = query;
            tooltipSearch(id, query);

        }
        afterRender();
    }

    setTimeout(() => {
        document.addEventListener('click', clickOutsideTooltip);
    }, 100);

};
window.setTooltipSearchResults = function(tooltipId, results) {

    let tooltip_scroll = document.getElementById('rev-tooltip__scroll_' + tooltipId);
    // to prevent jumping
    tooltip_scroll.style.minHeight = tooltip_scroll.offsetHeight + 'px';
    let html = '';
    if (!results || !results.length) {
        html = '<center class="no-results">Sorry, found no search results.</center>'
    } else {
        for (let r of results) {
            html += `<div class='sr'>${r}</div>`;
        }
    }
    tooltip_scroll.innerHTML = html;
    tooltip_scroll.scrollTop = 0;
    setTimeout(function(){
        let tooltip = document.getElementById('rev-tooltip_' + tooltipId);
        let sbox = tooltip.getBoundingClientRect();
        if (sbox.top < 0) {
            tooltip_scroll.style.maxHeight = Math.max(100, tooltip_scroll.offsetHeight + sbox.top) + 'px'; 
        }
        if (typeof(window.MathJax) !== 'undefined' && window.MathJax.typeset) {
            window.MathJax.typeset();
        }
    }, 50);

};
if (typeof(window._revTooltipIdCount) === 'undefined') {

    window._revTooltipIdCount = 1;

    document.addEventListener('mouseup', (event) => {
        let selection = window.getSelection().toString().replace(/\n|\s{2,}/g, ' ');
        if (selection && selection.trim().length) {
            renderNewTooltip(selection);
        }
    });
}

window.onTooltipBottomBarMouseup = function(e) {
    if (_tooltipResize.resizing) {
        return;
    }
    e.stopPropagation();
}

/* zooming */ 

window.tooltipZoomOut = function(event, id) {
    let tooltipScrollBody = document.getElementById('rev-tooltip__scroll_'+id);
    if (!tooltipScrollBody.dataset.zoom) {
        tooltipScrollBody.dataset.zoom = "1";
    }
    let currentZoomLevel = Number(tooltipScrollBody.dataset.zoom)
    let newZoomLevel = currentZoomLevel > 0.3 ? currentZoomLevel - 0.1 : currentZoomLevel;
    tooltipScrollBody.style.zoom = newZoomLevel;
    tooltipScrollBody.dataset.zoom = newZoomLevel.toString();
}
window.tooltipZoomIn = function(event, id) {
    let tooltipScrollBody = document.getElementById('rev-tooltip__scroll_'+id);
    if (!tooltipScrollBody.dataset.zoom) {
        tooltipScrollBody.dataset.zoom = "1";
    }
    let currentZoomLevel = Number(tooltipScrollBody.dataset.zoom)
    let newZoomLevel = currentZoomLevel < 2.0 ? currentZoomLevel + 0.1 : currentZoomLevel;
    tooltipScrollBody.style.zoom = newZoomLevel;
    tooltipScrollBody.dataset.zoom = newZoomLevel.toString();
}


/* resizing */

window._tooltipResize = {
    el: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    resizing: false
};
window.initResize = function(e, id) {
    e.preventDefault();
    let r = window._tooltipResize;
    r.resizing = true;
    let tooltip = document.getElementById('rev-tooltip_'+id);
    r.el = tooltip;
    if (r.el.style.bottom && r.el.style.bottom.length) {
        r.el.style.top = r.el.getBoundingClientRect().top + 'px';
        r.el.style.bottom = null;
    } 
    r.startX = e.clientX;
    r.startY = e.clientY;
    r.startWidth = parseInt(document.defaultView.getComputedStyle(tooltip).width, 10);
    r.startHeight = parseInt(document.defaultView.getComputedStyle(tooltip).height, 10);
    document.documentElement.addEventListener('mousemove', doResizeDrag, false);
    document.documentElement.addEventListener('mouseup', stopResizeDrag, false);
}
window.doResizeDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    let r = window._tooltipResize;
    r.el.style.width = (r.startWidth + e.clientX - r.startX) + 'px';
    r.el.style.height = (r.startHeight + e.clientY - r.startY) + 'px';
    r.el.style.maxWidth = r.el.style.width;
    r.el.style.maxHeight = r.el.style.height;
}
window.stopResizeDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    document.documentElement.removeEventListener('mousemove', doResizeDrag, false);    
    document.documentElement.removeEventListener('mouseup', stopResizeDrag, false);
    _tooltipResize.resizing = false;
}