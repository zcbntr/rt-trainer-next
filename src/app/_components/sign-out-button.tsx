import { MdLogout } from "react-icons/md";
import { signOut } from "~/server/auth";

export default function SignOutButton() {
  return (
    <button
      type="submit"
      onClick={async () => {
        "use server";

        await signOut({ redirectTo: "/" });
      }}
    >
      <div className="flex flex-row place-content-start gap-2">
        <div className="flex flex-col place-content-center">
          <MdLogout />
        </div>
        Sign Out
      </div>
    </button>
  );
}