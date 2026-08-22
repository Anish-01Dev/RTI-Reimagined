"""Answer Integrity Engine.

Classifies each original question against a received government response
as answered, partially answered, or missing, with a supporting excerpt.
Classification is a suggestion recorded against response_items; it is
confirmed or overridden by the citizen and never mutates case state
directly.
"""
