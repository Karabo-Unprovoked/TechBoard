# Guardian Assist

Computer Guardian's repair ticket management system.

## Public Access URLs

The following URLs are publicly accessible without login:

- **Book a Device Repair**: `https://guardianassist.computerguardian.co.za/bookdevice`
  - Alternative: `/book-device` or `/register`
  - Allows customers to register their devices for repair online

- **Track Your Repair**: Access via the main page tracking search
  - Customers can search using their ticket number

## Admin Access

Admin users can log in at the main page to access the dashboard.

## Environment Configuration

Create a `.env` file with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_APP_URL=https://your-production-domain.com
```

**Important for QR Codes**: The `VITE_APP_URL` should be set to your production domain when deploying. This ensures that QR codes on ticket labels point to the correct URL. If not set or set to localhost, the system will automatically use the current browser URL.
