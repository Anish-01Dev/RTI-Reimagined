"""Offline operation queue handling.

Applies a sequenced, per-device batch of client-queued operations
idempotently, rejecting any operation whose sequence number has already
been applied for that device.
"""
