"""Ed25519 key loading for evidence certificates.

Only one signing key is configured at a time (app.config.Settings), so the
public key used for verification is derived from the same private key
rather than distributed separately — there is no independent verifier
deployment in this build's scope.
"""

from __future__ import annotations

from functools import lru_cache

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import load_pem_private_key

from app.config import Settings, settings


@lru_cache(maxsize=1)
def _load_private_key(key_path: str) -> Ed25519PrivateKey:
    with open(key_path, "rb") as key_file:
        key = load_pem_private_key(key_file.read(), password=None)
    if not isinstance(key, Ed25519PrivateKey):
        raise TypeError(f"{key_path} is not an Ed25519 private key")
    return key


def signing_key(settings_: Settings = settings) -> Ed25519PrivateKey:
    return _load_private_key(settings_.evidence_signing_key_path)


def public_key(settings_: Settings = settings) -> Ed25519PublicKey:
    return signing_key(settings_).public_key()
