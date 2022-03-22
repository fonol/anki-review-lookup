from collections import Counter
from dataclasses import dataclass

from .analysis import analyze

@dataclass
class Document:

    id      : int
    text    : str

    def analyze(self):

        tokens                  = analyze(self.text)
        self.term_frequencies   = Counter(tokens)

        return set(tokens)

    def term_frequency(self, term):
        return self.term_frequencies.get(term, 0)