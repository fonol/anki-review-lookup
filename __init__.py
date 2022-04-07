from aqt import mw, gui_hooks
import aqt
import time
import json
import os
from typing import List, Any, Tuple
from .analysis import *
from .document import Document
from .utils import prettify_search_result_html
from .index import Index


# search index, initialized at Anki start
INDEX           : Index = None

# tracking which note is shown in the reviewer, to exclude it from search
current_nid     : int   = None

# this script is inserted into the reviewer
tooltip_script  : str   = None

config          : Any   = None

def setup_addon():

    global tooltip_script, config
    tooltip_script  = get_tooltip_script()
    config          = mw.addonManager.getConfig(__name__)
    
    # use the profile did open hook, because the collection is initialized then already (otherwise we will get a null ref on mw.col)
    gui_hooks.profile_did_open.append(build_index)

    # when question is shown, we want to store the id of the current note (to exclude it from search)
    gui_hooks.reviewer_did_show_question.append(on_did_show_question)

    gui_hooks.webview_did_receive_js_message.append(expanded_on_bridge_cmd)

    # when the reviewer webview loads its content, we inject the tooltip style and scripts
    gui_hooks.webview_will_set_content.append(on_webview_will_set_content)



def on_webview_will_set_content(web_content: Any, context):

    if not isinstance(context, aqt.reviewer.Reviewer):
        return

    font_size = str(config["results.font_size"])
    if font_size.isnumeric():
        font_size += "px"

    web_content.head += f"""
        <style>
            :root {{
                --rev-search-tooltip-fontsize: {font_size};
            }}
        </style>
    """
    web_content.head += """<style>
            .rev-tooltip {
                position: absolute;
                box-shadow: 2px 2px 5px black;
                border-radius: 5px;
                padding: 10px 5px 0 10px;
                overflow: hidden;
                background: white !important;
                border: 1px solid #b7b7b7 !important;
                box-shadow: 2px 2px 5px #9e9e9e;
                max-width: 370px;
                max-height: 500px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .night_mode .rev-tooltip {
                background: #2f2f31 !important;
                border: 1px solid #383838 !important;
                box-shadow: 2px 2px 5px black;
            }
            .rev-tooltip__scroll {
                display: flex;
                overflow-y: auto;
                padding-right: 8px;
                flex: 1;
                justify-content: start;
                flex-wrap: wrap;
                align-items: baseline;
            }
            .rev-tooltip__scroll .sr {
                width: auto;
                flex: 1 1 200px;
                text-align: left;
                margin: 5px;
                border-radius: 5px;
                padding: 10px;
                overflow: hidden;
                font-size: var(--rev-search-tooltip-fontsize) !important;
                border: 1px solid #eaeaea;
                border-color: #eaeaea !important;
                background: #f9f9f9 !important;
            } 
            .rev-tooltip__scroll > .sr:first-child {
                margin-top: 0;
            }
            .rev-tooltip__scroll > .sr:last-child {
                margin-bottom: 0;
            }
            .rev-tooltip__scroll .sr hr {
                border-top: 1px solid #e8e8e8 !important;
                border-bottom: none !important;
                border-left: none !important;
                border-right: none !important;
                border-color: #e8e8e8 !important;
            }
            .night_mode .rev-tooltip__scroll .sr hr {
                border-top: 1px solid #484848 !important;
                border-color: #484848 !important;
            }
            .rev-tooltip__search {
                border-bottom: 1px solid #e4e4e4;
                margin-bottom: 10px !important;
                display: flex;
                justify-content: center;
                padding-bottom: 8px;
            }
            .night_mode .rev-tooltip__search {
                border-bottom: 1px solid #383838 !important;
            }
            .rev-tooltip__search_icn {
                color: #333;
            }
            .night_mode .rev-tooltip__search_icn {
                color: #8a8a8a;
            }
            .rev-tooltip__search > input {
                flex: 1;
                border-color: transparent !important;
                border: none;
                background: transparent !important;
                font-size: 20px !important;
                margin-left: 10px;
            }
            .night_mode .rev-tooltip__search > input {
                color: lightgrey !important;
            }
            .rev-tooltip__search > input:focus {
                outline: none !important;
            }
            .night_mode .rev-tooltip .sr {
                border: 1px solid #484848;
                border-color: #484848 !important;
                background: #383838 !important;
            }
            .rev-tooltip__bottom {
                text-align: right;
                padding: 3px 0;
                user-select: none;
            }
            .rev-tooltip__resize, .rev-tooltip__zoom {
                height: 15px;
                width: 15px;
                opacity: 0.5;
                margin-left: 5px;
                cursor: pointer;
            }
            .night_mode .rev-tooltip__resize, .night_mode .rev-tooltip__zoom {
                color: #8a8a8a;
            }
            .rev-tooltip__resize:hover, .rev-tooltip__zoom:hover {
                opacity: 1.0;
            }
            center.no-results {
                user-select: none;
                margin: 20px 0;
                width: 100%;
            }
        </style>"""
    web_content.body += f"""<script type='text/javascript'>

        window.REV_SEARCH_MAX_QUERY_LENGTH = {config["query.max_length"]};
        window.REV_SEARCH_SHOULD_BLUR = {str(config["blur_nested_tooltips"]).lower()};

        {tooltip_script}</script>"""

def on_did_show_question(card: Any): 

    global current_nid
    current_nid = card.nid

def get_tooltip_script() -> str:

    script_file = addon_folder() + "tooltip.js"
    with open(script_file, 'r') as file:
        script = file.read()

    return script

def expanded_on_bridge_cmd(handled: Tuple[bool, Any], cmd: str, self: Any) -> Tuple[bool, Any]:

    if not isinstance(self, aqt.reviewer.Reviewer):
        return handled

    if cmd.startswith("rev-search "):

        tooltip_id = int(cmd.split()[1])
        query      = " ".join(cmd.split()[2:])
        notes       = run_search(query)
        notes       = [prettify_search_result_html(n.text, query, config["should_highlight"]) for n in notes]

        self.web.page().runJavaScript(f"setTooltipSearchResults({tooltip_id}, {json.dumps(notes)})")
        return (True, None)

    return handled

def run_search(query: str) -> List[Any]: 

    if len(query.strip()) == 0:
        return []

    # start   = time.time() * 1000
    res     = INDEX.search(query, search_type='OR', rank=True, top = int(config["results.limit"]))
    res     = [r[0] for r in res]

    # print(f"[Review Search] Search took {time.time() * 1000 - start} ms, found {len(res)} results")

    return res



def load_notes():
    """ Load the notes to be indexed from Anki's database. """

    decks_to_exclude = config["excluded_decks"]
    if decks_to_exclude is None or len(decks_to_exclude) == 0:
        notes = mw.col.db.all("select id, flds from notes")
    else:
        dids  = [mw.col.decks.id_for_name(n) for n in decks_to_exclude if n]
        dids  = [str(did) for did in dids if did is not None]
        if len(dids) == 0:
            notes = mw.col.db.all("select id, flds from notes")
        else:
            dids  = ",".join(dids)
            notes = mw.col.db.all(f"select n.id, n.flds from notes n join cards c on n.id = c.nid where c.did not in ({dids}) group by n.id")

    notes = [Document(n[0], n[1]) for n in notes]
    return notes

def build_index():
    global INDEX

    # start = time.time() * 1000

    notes = load_notes()
    index = Index()
    for note in notes:
        index.index_document(note)

    INDEX = index
    # print(f"[Review Search] Index contains {INDEX.size()} notes")
    # print(f"[Review Search] Indexing took {time.time() * 1000 - start} ms")



def addon_folder() -> str:
    """ Absolute path to add-on folder. """

    dir = os.path.dirname(os.path.realpath(__file__)).replace("\\", "/")
    if not dir.endswith("/"):
        return dir + "/"
    return dir

setup_addon()