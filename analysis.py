import re
import string

STOPWORDS   = set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
                 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
                 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'has', 'is', 'are', 'no'])

TOKENIZE    = re.compile(r"[ \n\t\x1f%s-]" % re.escape(string.punctuation))

def tokenize(text):
    return TOKENIZE.split(text)


def analyze(text, lowercase=True):

    tokens = tokenize(text)

    if lowercase:
        tokens = [token.lower() for token in tokens]

    return [token for token in tokens if token not in STOPWORDS and token]
