'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setUserLocale } from '@/services/locale';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const [isPending, startTransition] = useTransition();

    const toggleLocale = () => {
        const nextLocale = locale === 'en' ? 'zh' : 'en';
        startTransition(() => {
            setUserLocale(nextLocale);
        });
    };

    return (
        <button
            onClick={toggleLocale}
            disabled={isPending}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
            {locale === 'en' ? '🇨🇳 中文' : '🇺🇸 English'}
        </button>
    );
}
