import re
from typing import Optional

class AffiliateRewriter:
    def __init__(self):
        # Affiliate tags mapping
        self.tags = {
            "amazon.com": "genii-20",
            "walmart.com": "genii-aff",
            "clickup.com": "genii-partner",
            "slack.com": "genii-opt",
            "uber.com": "genii-ride",
            "doordash.com": "genii-food"
        }

    def rewrite_url(self, url: str) -> str:
        """
        Rewrites a URL to include the Genii affiliate tag if a mapping exists.
        """
        for domain, tag in self.tags.items():
            if domain in url:
                if "?" in url:
                    return f"{url}&ref={tag}" if "amazon" not in domain else f"{url}&tag={tag}"
                else:
                    return f"{url}?ref={tag}" if "amazon" not in domain else f"{url}?tag={tag}"
        return url

# Singleton instance
rewriter = AffiliateRewriter()
