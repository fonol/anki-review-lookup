# Based on:
# https://github.com/bartdegoede/python-searchengine/

import math

from .analysis import analyze

class Index:

    def __init__(self):
        self.index = {}
        self.documents = {}

    def size(self): 
        return len(self.documents)

    def index_document(self, document):

        self.documents[document.id] = document
        for token in document.analyze():
            if token not in self.index:
                self.index[token] = []
            self.index[token].append(document.id)

    def document_frequency(self, token):
        return len(self.index.get(token, []))

    def inverse_document_frequency(self, token):
        return math.log10(len(self.documents) / max(self.document_frequency(token), 1))

    def _results(self, analyzed_query):
        return [set(self.index.get(token, [])) for token in analyzed_query]

    def search(self, query, search_type='AND', rank=False, top=10):
        """
        Search; this will return documents that contain words from the query,
        and rank them if requested (sets are fast, but unordered).
        Parameters:
          - query: the query string
          - search_type: ('AND', 'OR') do all query terms have to match, or just one
          - score: (True, False) if True, rank results based on TF-IDF score
        """
        if search_type not in ('AND', 'OR'):
            return []

        analyzed_query = analyze(query)

        if len(analyzed_query) == 0:
            return []

        results         = self._results(analyzed_query)
        if search_type == 'AND':
            # all tokens must be in the document
            documents = [self.documents[doc_id] for doc_id in set.intersection(*results)]
        if search_type == 'OR':
            # only one token has to be in the document
            documents = [self.documents[doc_id] for doc_id in set.union(*results)]

        if rank:
            return self.rank(analyzed_query, documents)[:top]
        return documents[:top]

    def rank(self, analyzed_query, documents):

        results = []
        if not documents:
            return results

        for document in documents:
            score = 0.0
            for token in analyzed_query:
                tf      = document.term_frequency(token)
                idf     = self.inverse_document_frequency(token)
                score   += tf * idf
            results.append((document, score))

        return sorted(results, key=lambda doc: doc[1], reverse=True)