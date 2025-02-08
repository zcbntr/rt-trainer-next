import Link from "next/link";
import SignInButton from "~/app/_components/sign-in-button";
import SignOutButton from "~/app/_components/sign-out-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { api } from "~/trpc/server";
import {
  MdOutlineCalendarMonth,
  MdOutlinePets,
  MdOutlineSettings,
  MdPerson,
} from "react-icons/md";
import { initials } from "~/lib/utils";
import { auth, signOut } from "~/server/auth";

export default async function TopNav() {
  const session = await auth();

  if (!session) {
    return (
      <header className="border-b border-[#e0e0e0] bg-[#f5f5f5] px-2 py-3 md:px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold">
            sittr
          </Link>
          <nav className="items-center space-x-6 md:flex">
            <div className="flex place-content-center">
              <SignInButton />
            </div>
          </nav>
        </div>
      </header>
    );
  } else {
    const loggedInUser = await api.user.getLoggedInUser();

    // Sign user out if they don't have a user account
    if (!loggedInUser) {
      await signOut();
    }

    return (
      <header className="border-b border-[#e0e0e0] bg-[#f5f5f5] px-2 py-3 md:px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold">
            RT-Trainer
          </Link>

          <nav className="flex flex-row items-center space-x-3">
            <div className="flex flex-col place-content-center">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="relative inline-block">
                    <Avatar className="border-2 border-opacity-50">
                      <AvatarImage
                        src={loggedInUser?.image ?? undefined}
                        alt={`${loggedInUser?.name}'s avatar`}
                      />
                      <AvatarFallback>
                        {loggedInUser?.name ? initials(loggedInUser?.name) : <MdPerson />}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="mx-1.5 min-w-[200px] max-w-full md:max-w-96">
                  <DropdownMenuItem>
                    <Link
                      href="/"
                      className="flex flex-row place-content-start gap-2"
                    >
                      <div className="flex flex-col place-content-center">
                        <MdOutlineCalendarMonth />
                      </div>
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      href="/my-scenarios"
                      className="flex flex-row place-content-start gap-2"
                    >
                      <div className="flex flex-col place-content-center">
                        <MdOutlinePets />
                      </div>
                      My Scenarios
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      href="/settings"
                      className="flex flex-row place-content-start gap-2"
                    >
                      <div className="flex flex-col place-content-center">
                        <MdOutlineSettings />
                      </div>
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <SignOutButton />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </div>
      </header>
    );
  }
}
