import { redirect } from "next/navigation";

/** Redirige la raíz al calendario del dashboard. */
export default function Home() {
  redirect("/dashboard");
}
//Prueba deploy Gitea
