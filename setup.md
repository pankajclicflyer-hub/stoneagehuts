# StoneAgeHuts — Firebase Setup Guide

## Files in this project
```
index.html      ← Main website (public)
admin.html      ← Admin panel (password protected)
SETUP.md        ← This guide
```

---

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"** → Name it `stoneagehuts`
3. Enable Google Analytics (optional but recommended)

---

## Step 2: Enable Services

In Firebase Console sidebar:

### Firestore Database
- Click **Firestore Database** → **Create database**
- Choose **Production mode** → Select region (asia-south1 for India)

### Firebase Storage
- Click **Storage** → **Get started**
- Choose region (same as Firestore)

### Authentication
- Click **Authentication** → **Get started**
- Click **Sign-in method** → Enable **Email/Password**
- Go to **Users** tab → Click **Add user**
- Add: `admin@stoneagehuts.com` and your chosen password

---

## Step 3: Get Your Config

1. Go to **Project Settings** (gear icon) → **Your apps**
2. Click **</>** (Web app) → Register app as `stoneagehuts-web`
3. Copy the `firebaseConfig` object

---

## Step 4: Update Both HTML Files

In BOTH `index.html` and `admin.html`, find this section and replace with your values:

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",           // ← Replace
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",        // ← Replace
  storageBucket:     "YOUR_PROJECT_ID.appspot.com"  # make sure it uses the .appspot.com domain (not .firebasestorage.app)
  messagingSenderId: "YOUR_SENDER_ID",         // ← Replace
  appId:             "YOUR_APP_ID"             // ← Replace
};
```

---

## Step 5: Firestore Security Rules

> **Warning:** security rules are the gatekeeper for your database. The following policy allows *any authenticated admin-panel user* to read the data needed by the interface while still restricting write operations to true administrators (identified via a custom `admin` claim).  Public visitors can submit forms/bookings/newsletter entries but cannot view backend collections.
>
> In Firebase Console → Firestore → **Rules**, paste this full policy:
>
> ```
> rules_version = '2';
> service cloud.firestore {
>   match /databases/{database}/documents {
>
>     // helper to identify admin users (use custom claims)
>     function isAdmin() {
>       return request.auth != null && request.auth.token.admin == true;
>     }
>
>     // reviews: logged‑in user may read all reviews (dashboard counts, list);
>     // only admins may update status or delete.
>     match /reviews/{reviewId} {
>       allow read: if request.auth != null;
>       allow create: if true;
>       allow update, delete: if isAdmin();
>     }
>
>     // enquiries: read for any signed‑in user, create open, manage by admins.
>     match /enquiries/{enqId} {
>       allow read: if request.auth != null;
>       allow create: if true;
>       allow update, delete: if isAdmin();
>     }
>
>     // bookings
>     match /bookings/{id} {
>       allow read: if request.auth != null;
>       allow create: if true;
>       allow update, delete: if isAdmin();
>     }
>
>     // newsletter subscriptions
>     match /newsletter/{id} {
>       allow read: if request.auth != null;
>       allow create: if true;
>       allow delete: if isAdmin();
>     }
>
>     // gallery, posts, contact/settings
>     match /gallery/{id} {
>       allow read: if true;
>       allow write: if isAdmin();
>     }
>     match /posts/{id} {
>       allow read: if resource.data.published == true || isAdmin();
>       allow write: if isAdmin();
>     }
>     match /contact_info/{id} {
>       allow read: if true;
>       allow write: if isAdmin();
>     }
>     match /settings/{id} {
>       allow read: if true;
>       allow write: if isAdmin();
>     }
>
>     // analytics: clients may log, any signed‑in panel user may read stats
>     match /analytics/{docId} {
>       allow write: if true;
>       allow read: if request.auth != null;
>     }
>
>     // fallback: deny everything else
>     match /{document=**} {
>       allow read, write: if false;
>     }
>   }
> }
> ```
>
> These rules allow any logged‑in user to see the admin dashboard contents, while
> still requiring a custom `admin` claim for any destructive or write actions.
>
> You can test the rules using the Firebase emulator or the built‑in rules simulator before deploying.

---

## Step 6: Storage Rules

In Firebase Console → Storage → **Rules**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Step 7: Deploy to GitHub Pages

1. Push both `index.html` and `admin.html` to your GitHub repo
2. Go to repo **Settings** → **Pages**
3. Source: **Deploy from branch** → `main` → `/ (root)`
4. Your site: `https://yourusername.github.io/your-repo-name/`
5. Admin panel: `https://yourusername.github.io/your-repo-name/admin.html`

---

## How it works

| Feature | What happens |
|---------|-------------|
| **Hero Image** | Upload in admin → stored in Firebase Storage → shown on website |
| **Gallery** | Upload with category → stored in Storage + Firestore → filtered gallery on website |
| **Blog Posts** | Create/edit in admin → saved in Firestore → shown on website |
| **Reviews** | User submits → saved as `pending` → admin approves/rejects → approved ones show |
| **Enquiries** | Contact form → saved to Firestore → view in admin, mark read/delete |
| **Bookings** | Book button → saved to Firestore → view all in admin |
| **Newsletter** | Subscribe → saved to Firestore → export CSV from admin |
| **Analytics** | Every click/pageview → saved to Firestore → view in admin |
| **Contact Info** | Edit in admin → saved to Firestore → website reads and shows it live |

---

## Admin Panel URL
`https://yourdomain.com/admin.html`

Login with the Firebase Auth user you created in Step 2.