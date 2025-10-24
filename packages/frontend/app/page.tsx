/**
 * Root Page - Redirects to simplified home
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/home');
}