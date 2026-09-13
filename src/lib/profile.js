// Sign-up only asks for an email and a password, so a brand-new account has no
// name and no phone — both of which every booking needs. A user in that state
// is sent to /complete-profile before any guarded route will render.

export function isProfileComplete(user) {
  if (!user) return false;
  return Boolean(String(user.full_name || "").trim() && String(user.phone || "").trim());
}

export const COMPLETE_PROFILE_PATH = "/complete-profile";
