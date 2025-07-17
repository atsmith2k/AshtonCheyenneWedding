# Page snapshot

```yaml
- alert
- img
- heading "Ashton & Cheyenne" [level=1]
- paragraph: Wedding Admin Portal
- img
- heading "Admin Login" [level=2]
- paragraph: Please sign in to access the wedding admin dashboard.
- text: Email Address
- textbox "Email Address"
- text: Password
- textbox "Password"
- button "Sign In to Admin Dashboard" [disabled]:
  - text: Sign In to Admin Dashboard
  - img
- paragraph: Not an admin?
- link "Return to Wedding Website":
  - /url: /
  - img
  - text: Return to Wedding Website
- heading "Admin Access" [level=3]
- paragraph: This area is restricted to wedding administrators only.
- paragraph: If you're having trouble accessing the admin dashboard, please contact the system administrator.
- paragraph: Secure admin portal for Ashton & Cheyenne's wedding 🔒
```