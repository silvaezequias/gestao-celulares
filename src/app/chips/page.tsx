import { redirect } from 'next/navigation';

// A antiga aba "Chips" virou a aba "Números".
export default function Page() {
  redirect('/numeros');
}
