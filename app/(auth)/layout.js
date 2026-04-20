/*
 * File Overview:
 * Use Case: Auth pages (sign-in/sign-up) ke liye dedicated centered layout provide karta hai.
 * Project Role: Authentication screens ko main app chrome se visual separation deta hai.
 * Typical Trigger: Auth route group render hone par automatic use hota hai.
 * File Path: app/(auth)/layout.js
 */
const AuthLayout = ({ children }) => {
  // Note: auth pages ko center + top padding dekar clean entry UI banate hain.
  // Note: children me sign-in/sign-up routed pages aati hain.
  return <div className="flex justify-center pt-40">{children}</div>;
};

// Note: Next App Router layout export.
export default AuthLayout;
