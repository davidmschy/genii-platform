from typing import Dict, Any

class EmailTemplater:
    """
    Generates high-end enterprise email HTML.
    """
    
    @staticmethod
    def get_template(name: str, params: Dict[str, Any]) -> str:
        if name == "onboarding":
            return EmailTemplater._render_onboarding(params)
        elif name == "roi_report":
            return EmailTemplater._render_roi_report(params)
        return "<html><body>Default Genii Email</body></html>"

    @staticmethod
    def _render_onboarding(params):
        return f"""
        <html>
        <body style="background-color: #000; color: #fff; font-family: sans-serif; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #333; border-radius: 20px; padding: 40px;">
                <h1 style="font-size: 32px; letter-spacing: -1px;">Welcome to the Frontier, {params.get('name')}.</h1>
                <p style="color: #888; line-height: 1.6;">Your autonomous Genii instance is now active. We have provisioned your space with full integration capabilities.</p>
                <a href="{params.get('login_url')}" style="display: inline-block; background-color: #fff; color: #000; padding: 15px 30px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 20px;">Access Dashboard</a>
            </div>
        </body>
        </html>
        """

    @staticmethod
    def _render_roi_report(params):
        return f"""
        <html>
        <body style="background-color: #000; color: #fff; font-family: sans-serif; padding: 40px;">
             <h1 style="font-size: 24px;">Daily ROI Briefing: {params.get('date')}</h1>
             <div style="background: #111; padding: 20px; border-radius: 15px;">
                <p>Net Profit: <span style="color: #0f0; font-weight: bold;">{params.get('profit')}</span></p>
                <p>Actions Taken: {params.get('actions')}</p>
             </div>
             <p style="margin-top: 20px;"><a href="{params.get('report_url')}" style="color: #aaa;">View Interactive Report &rarr;</a></p>
        </body>
        </html>
        """
