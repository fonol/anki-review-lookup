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
    tooltip.innerHTML = `<div class='rev-tooltip__search'><input type='text' id='rev-tooltip__search_${id}' onkeyup='tooltipSearch(${id}, this.value)' onmouseup='event.preventDefault(); event.stopPropagation();' onclick='event.preventDefault(); event.stopPropagation();' placeholder='Search'/></div><div class='rev-tooltip__scroll' id='rev-tooltip__scroll_${id}'>${loader}</div>`;
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
        html = '<center>Sorry, found no search results.</center>'
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
        let selection = window.getSelection().toString();
        if (selection && selection.trim().length) {
            renderNewTooltip(selection);
        }
    });
}