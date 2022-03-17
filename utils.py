import re
from .analysis import analyze

def prettify_search_result_html(html: str, query: str) -> str:

    if html is None:
        return ""

    
    query_tokens    = set(analyze(query, lowercase=False))
    for qt in query_tokens:
        html = re.sub(r"\b%s\b" % re.escape(qt), f"<mark>{qt}</mark>", html, flags=re.I)


    html = re.sub("\x1f(?:\x1f)*", "<hr/>", html)
    html = re.sub(r"(?:<[hb]r/?>\w*)*$", "", html)

    return html

    


