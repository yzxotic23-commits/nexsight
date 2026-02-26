# Toast Notification System Documentation

Dokumentasi lengkap untuk sistem Toast Notification yang dapat digunakan di project lain.

## 📋 Overview

Sistem toast notification ini menyediakan notifikasi yang elegan dengan animasi smooth, support untuk dark/light mode, dan 4 jenis toast (success, error, info, warning).

## 🎯 Features

- ✅ 4 jenis toast: `success`, `error`, `info`, `warning`
- ✅ Animasi smooth dengan Framer Motion
- ✅ Auto-dismiss dengan progress bar
- ✅ Support dark/light mode
- ✅ Customizable duration
- ✅ Multiple toasts support
- ✅ Responsive design
- ✅ Accessible (ARIA labels)

## 📦 Dependencies

```json
{
  "dependencies": {
    "framer-motion": "^11.3.19",
    "lucide-react": "^0.427.0",
    "react": "^18.3.1"
  }
}
```

## 📁 File Structure

```
lib/
  ├── toast-context.tsx          # Context provider dan hook
  └── theme-context.tsx           # Theme context (optional, untuk dark/light mode)

components/
  ├── ui/
  │   └── toast.tsx               # Toast component dan container
  └── ToastContainerWrapper.tsx   # Wrapper untuk toast container
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install framer-motion lucide-react
# atau
yarn add framer-motion lucide-react
```

### 2. Copy Files

Copy file-file berikut ke project Anda:
- `lib/toast-context.tsx`
- `components/ui/toast.tsx`
- `components/ToastContainerWrapper.tsx`
- `lib/theme-context.tsx` (optional, jika ingin support dark/light mode)

### 3. Setup Theme Context (Optional)

Jika Anda sudah punya theme context, skip langkah ini. Jika belum, copy `lib/theme-context.tsx` dan wrap aplikasi Anda dengan `ThemeProvider`.

### 4. Setup Toast Provider

Di root layout atau App component, wrap aplikasi dengan `ToastProvider` dan tambahkan `ToastContainerWrapper`:

```tsx
// app/layout.tsx atau _app.tsx
import { ToastProvider } from '@/lib/toast-context';
import { ToastContainerWrapper } from '@/components/ToastContainerWrapper';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider> {/* Optional, jika menggunakan theme */}
          <ToastProvider>
            {children}
            <ToastContainerWrapper />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## 💻 Usage

### Basic Usage

```tsx
'use client';

import { useToast } from '@/lib/toast-context';

export function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('Operation successful!', 'success');
  };

  const handleError = () => {
    showToast('Something went wrong!', 'error');
  };

  const handleInfo = () => {
    showToast('This is an info message', 'info');
  };

  const handleWarning = () => {
    showToast('Please be careful!', 'warning');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleInfo}>Show Info</button>
      <button onClick={handleWarning}>Show Warning</button>
    </div>
  );
}
```

### Custom Duration

```tsx
const { showToast } = useToast();

// Toast akan muncul selama 5 detik (5000ms)
showToast('This message will show for 5 seconds', 'info', 5000);

// Default duration adalah 4000ms (4 detik)
showToast('This message will show for 4 seconds', 'success');
```

### Advanced Usage

```tsx
const { showToast, toasts, removeToast } = useToast();

// Check jumlah toast yang aktif
console.log(`Active toasts: ${toasts.length}`);

// Remove toast secara manual
if (toasts.length > 0) {
  removeToast(toasts[0].id);
}
```

## 🎨 Toast Types

### Success Toast
```tsx
showToast('Data saved successfully!', 'success');
```
- Icon: CheckCircle2 (green)
- Use case: Konfirmasi operasi berhasil

### Error Toast
```tsx
showToast('Failed to save data', 'error');
```
- Icon: AlertCircle (red)
- Use case: Error atau kegagalan operasi

### Info Toast
```tsx
showToast('New update available', 'info');
```
- Icon: Info (blue)
- Use case: Informasi umum

### Warning Toast
```tsx
showToast('Please check your input', 'warning');
```
- Icon: AlertTriangle (yellow)
- Use case: Peringatan atau perhatian

## 🎨 Styling

### Color Schemes

Toast menggunakan gradient background dan border yang berbeda untuk setiap type:

**Success:**
- Dark mode: `from-green-600/25 to-green-500/15`
- Light mode: `from-green-500/15 to-green-400/10`
- Border: `border-green-500/50`

**Error:**
- Dark mode: `from-red-500/30 to-red-600/20`
- Light mode: `from-red-500/20 to-red-600/15`
- Border: `border-red-500/60`

**Info:**
- Dark mode: `from-blue-500/30 to-blue-600/20`
- Light mode: `from-blue-500/20 to-blue-600/15`
- Border: `border-blue-500/60`

**Warning:**
- Dark mode: `from-yellow-500/30 to-amber-500/20`
- Light mode: `from-yellow-500/20 to-amber-500/15`
- Border: `border-yellow-500/60`

### Customization

Anda dapat mengubah styling dengan memodifikasi fungsi `getToastStyles` di `components/ui/toast.tsx`:

```tsx
const getToastStyles = (isDark: boolean) => ({
  success: {
    bg: 'your-custom-bg-classes',
    border: 'your-custom-border-classes',
    icon: 'your-custom-icon-color',
    text: 'your-custom-text-color',
    glow: 'your-custom-shadow',
  },
  // ... lainnya
});
```

## 📐 Positioning

Toast muncul di pojok kanan atas dengan posisi fixed:

```tsx
// Di ToastContainer component
<div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
```

Anda dapat mengubah posisi dengan memodifikasi class di `components/ui/toast.tsx`:

- **Top Right**: `top-4 right-4`
- **Top Left**: `top-4 left-4`
- **Bottom Right**: `bottom-4 right-4`
- **Bottom Left**: `bottom-4 left-4`
- **Top Center**: `top-4 left-1/2 -translate-x-1/2`

## ⚙️ Configuration

### Default Duration

Default duration adalah 4000ms (4 detik). Anda dapat mengubahnya di `components/ui/toast.tsx`:

```tsx
const duration = toast.duration || 4000; // Ubah angka ini
```

### Animation Settings

Animasi menggunakan Framer Motion dengan spring animation:

```tsx
// Di ToastItem component
<motion.div
  initial={{ opacity: 0, x: 400, scale: 0.8 }}
  animate={{ opacity: 1, x: 0, scale: 1 }}
  exit={{ opacity: 0, x: 400, scale: 0.8 }}
  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
>
```

Anda dapat mengubah:
- `x: 400` - Jarak slide dari kanan (ubah untuk arah berbeda)
- `damping: 25` - Kecepatan bounce
- `stiffness: 300` - Kekakuan animasi

## 🔧 Without Theme Context

Jika Anda tidak ingin menggunakan theme context, Anda dapat memodifikasi `components/ui/toast.tsx`:

```tsx
// Hapus import useTheme
// import { useTheme } from '@/lib/theme-context';

// Ganti dengan hardcoded theme
const isDark = false; // atau true untuk selalu dark mode

// Atau gunakan CSS class detection
const isDark = document.documentElement.classList.contains('dark');
```

## 📱 Responsive Design

Toast sudah responsive dengan:
- Min width: `320px`
- Max width: `420px`
- Padding yang sesuai untuk mobile dan desktop

## ♿ Accessibility

Toast sudah include:
- ARIA labels untuk close button
- Semantic HTML
- Keyboard accessible (close button dapat di-focus)

## 🐛 Troubleshooting

### Toast tidak muncul

1. Pastikan `ToastProvider` sudah wrap aplikasi
2. Pastikan `ToastContainerWrapper` sudah ditambahkan
3. Check console untuk error

### Theme tidak berubah

1. Pastikan `ThemeProvider` sudah setup
2. Pastikan `useTheme` hook bekerja dengan benar
3. Check apakah class `dark` atau `light` sudah ada di `<html>`

### Multiple toasts tidak stack

Pastikan `AnimatePresence` mode di-set ke `"popLayout"`:

```tsx
<AnimatePresence mode="popLayout">
```

## 📝 Example: Complete Integration

```tsx
// app/layout.tsx
import { ToastProvider } from '@/lib/toast-context';
import { ToastContainerWrapper } from '@/components/ToastContainerWrapper';
import { ThemeProvider } from '@/lib/theme-context';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ToastProvider>
            {children}
            <ToastContainerWrapper />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// components/MyComponent.tsx
'use client';

import { useToast } from '@/lib/toast-context';

export function MyComponent() {
  const { showToast } = useToast();

  const handleSubmit = async () => {
    try {
      await saveData();
      showToast('Data saved successfully!', 'success', 3000);
    } catch (error) {
      showToast('Failed to save data', 'error', 5000);
    }
  };

  return <button onClick={handleSubmit}>Save</button>;
}
```

## 📄 License

Gunakan bebas untuk project Anda!

## 🤝 Support

Jika ada pertanyaan atau issue, silakan buat issue di repository atau hubungi developer.

---

**Happy Coding! 🚀**
