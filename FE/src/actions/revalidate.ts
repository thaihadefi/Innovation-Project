'use server';
import { revalidatePath } from 'next/cache';

// Bust Full Route Cache + Router Cache for all pages affected by company profile updates
export async function revalidateCompanyProfile() {
  revalidatePath('/', 'layout');
}
