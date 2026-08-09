# منارة — منصة تعليمية عربية (Frontend)

واجهة أمامية كاملة، مبنية بـ React + Vite + TypeScript + Tailwind CSS، بدعم كامل للغة العربية (RTL)،
**متصلة فعلياً بالـ Backend الحقيقي (ASP.NET Core 9)** عبر Axios + JWT — لا توجد بيانات وهمية بعد الآن.

## 🚀 التشغيل محلياً

### 1. شغّل الـ Backend أولاً
راجع `ManaraPlatform/README.md` لتشغيل الـ API (يعمل افتراضياً على `http://localhost:5080`).

### 2. اضبط رابط الـ API (اختياري)
ملف `.env` موجود مسبقاً بالقيمة الافتراضية:
```
VITE_API_BASE_URL=http://localhost:5080/api
```
عدّله فقط إذا كان الـ API يعمل على منفذ أو رابط مختلف.

### 3. شغّل الواجهة
```bash
npm install
npm run dev
```
افتح `http://localhost:5173`.

للبناء (production build):
```bash
npm run build   # الناتج في مجلد dist/
npm run preview
```

## 🔑 حسابات تجريبية (مزروعة تلقائياً في قاعدة البيانات عند أول تشغيل للـ Backend)

| الدور | اسم المستخدم | كلمة المرور |
|---|---|---|
| المدرس | `admin` | `Admin123@` |
| طالب | `أحمد1` | `Pass1234` |

زرّا "حساب المدرس" و"حساب طالب" في صفحة تسجيل الدخول يعبّئان هذه البيانات تلقائياً.

## 🔌 كيف يعمل الاتصال بالـ Backend

- **`src/lib/api.ts`**: عميل Axios واحد، يُرفق تلقائياً الـ JWT Token من `localStorage`/`sessionStorage` مع كل طلب، ويلتقط أخطاء 401 لتسجيل الخروج التلقائي.
- **`src/services/*.ts`**: طبقة نداءات مباشرة لكل Endpoint في الـ API (طلاب، حصص، واجبات، اختبارات، إعلانات، درجات، أوسمة).
- **`src/lib/adapters.ts`**: يحوّل بين شكل بيانات الـ Backend (مثل `durationMinutes`) وشكل الواجهة (`duration`) في الحالات القليلة التي تختلف فيها التسمية — معظم الحقول متطابقة تلقائياً (camelCase في الطرفين).
- **`src/context/AuthContext.tsx`**: يسجّل الدخول عبر `POST /api/auth/login`، ويستعيد الجلسة عند إعادة تحميل الصفحة عبر `GET /api/auth/me` باستخدام التوكن المحفوظ.
- **`src/context/DataContext.tsx`**: يجلب كل البيانات من الـ API عند تسجيل الدخول، وكل عملية (إضافة/تعديل/حذف) تستدعي الـ Endpoint الحقيقي مباشرة ثم تُحدّث الحالة محلياً عند نجاحها. أي خطأ من السيرفر يظهر في Toast تلقائياً برسالة عربية واضحة.

## 🗂️ هيكل المشروع

```
src/
  components/ui/       → مكونات Shadcn (Button, Card, Dialog, ...)
  components/layout/   → Sidebar, Topbar, DashboardLayout, TeacherLayout, StudentLayout
  components/shared/   → RichTextEditor
  context/             → AuthContext, ThemeContext, DataContext, ToastContext
  lib/                 → api.ts (Axios client), adapters.ts, utils.ts
  services/            → دوال النداء لكل Endpoint (authService, studentsService, lessonsService, ...)
  pages/
    public/            → الصفحة الرئيسية (Landing)
    auth/               → تسجيل الدخول
    teacher/            → لوحة تحكم المدرس وكل الصفحات الإدارية
    student/            → لوحة الطالب وكل صفحاته
    shared/             → الملف الشخصي والإعدادات (مشتركة بين الدورين)
  routes/               → ProtectedRoute
  types/                → الأنواع المطابقة لاستجابات الـ API
```

## 🎨 نظام التصميم

- الخط: Cairo (عناوين) + IBM Plex Sans Arabic (نصوص)
- الألوان: أخضر زمردي عميق (#0E6B5C) كلون أساسي، وكهرماني (#E3A438) للإنجازات والتحفيز
- عنصر مميز: نمط نجمي هندسي (8 رؤوس) مستوحى من الزخرفة الإسلامية
- دعم كامل للوضع الداكن والفاتح

## 🚢 النشر على Vercel (مجاني بالكامل)

1. سجّل دخول إلى [vercel.com](https://vercel.com) بحساب GitHub وارفع مجلد `edu-platform` كـ repository.
2. **Add New → Project** → اربطه بالـ repo (Vercel يكتشف إعدادات Vite تلقائياً).
3. أضف متغير البيئة قبل الضغط على Deploy:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | رابط الـ Backend على Render + `/api` (مثال: `https://manara-backend.onrender.com/api`) |

4. ملف `vercel.json` الموجود بالفعل في المشروع يضمن عمل الروابط الداخلية (مثل `/student/lessons`) بشكل صحيح عند إعادة تحميل الصفحة مباشرة (SPA routing).
5. بعد النشر، خذ الرابط النهائي وحدّث بيه `Cors__AllowedOrigins__0` في إعدادات الـ Backend على Render — راجع `ManaraPlatform/README.md` لتفاصيل نشر الـ Backend كاملة.
