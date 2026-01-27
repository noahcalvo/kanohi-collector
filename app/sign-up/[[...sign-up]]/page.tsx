import { SignUp } from "@clerk/nextjs";

export default function Page(props: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const redirectUrl =
    typeof props.searchParams?.redirect_url === "string"
      ? props.searchParams.redirect_url
      : undefined;

  return (
    <div className="w-full flex justify-center">
      <SignUp redirectUrl={redirectUrl} />
    </div>
  );
}
