from collections import Counter
from dataclasses import dataclass

from .analysis import analyze

@dataclass
class Document:

    id      : int
    text    : str

    def analyze(self):
        self.term_frequencies = Counter(analyze(self.text))

    def term_frequency(self, term):
        return self.term_frequencies.get(term, 0)