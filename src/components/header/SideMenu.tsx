import {
  X,
  Home,
  FileText,
  Bookmark,
  User,
  Crown,
  Settings,
  Bell,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/use-profile';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { profile } = useProfile();

  if (!isOpen) return null;

  const displayName = profile?.show_name !== false ? profile?.first_name || 'Пользователь' : 'Аноним';
  const displayUsername =
    profile?.show_username !== false ? profile?.username || 'user' : profile ? 'скрыт' : 'гость';

  const displayAvatar =
    profile?.show_avatar !== false
      ? profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || profile?.first_name || 'user'}`
      : `https://api.dicebear.com/7.x/shapes/svg?seed=${profile?.id || 'guest'}`;

  const isPremium = !!profile?.is_premium;

  const menuItems = [
    { icon: Home, label: 'Главная', path: '/' },
    { icon: FileText, label: 'Хаб', path: '/hub' },
    { icon: Bookmark, label: 'Избранное', path: '/profile?tab=favorites' },
    { icon: User, label: 'Профиль', path: '/profile' },
    { icon: Crown, label: 'Premium', path: '/profile?premium=true' },
    { icon: Bell, label: 'Уведомления', path: '/profile?settings=notifications' },
    { icon: Settings, label: 'Настройки', path: '/profile?settings=true' },
    { icon: HelpCircle, label: 'Помощь', path: '#' },
    { icon: MessageSquare, label: 'Telegram канал', path: 'https://t.me/boyshub', external: true },
  ];

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Side panel */}
      <div className="absolute left-0 top-0 h-full w-72 bg-card shadow-xl animate-slide-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <img
              src={displayAvatar}
              alt={displayName}
              className="h-10 w-10 rounded-full border border-border"
              loading="lazy"
            />
            <div>
              <p className="font-heading font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground">@{displayUsername}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть меню">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {!profile && (
          <div className="border-b border-border p-4 text-sm text-muted-foreground">
            Откройте приложение из Telegram, чтобы загрузить ваш профиль.
          </div>
        )}

        {/* Menu items */}
        <nav className="p-4" aria-label="Основная навигация">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.label}>
                {item.external ? (
                  <a
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg p-3 text-foreground transition-colors hover:bg-secondary"
                    onClick={onClose}
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <Link
                    to={item.path}
                    className="flex items-center gap-3 rounded-lg p-3 text-foreground transition-colors hover:bg-secondary"
                    onClick={onClose}
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Premium CTA */}
        {!isPremium && (
          <div className="absolute bottom-4 left-4 right-4">
            <Link to="/profile?premium=true" onClick={onClose}>
              <Button className="w-full gap-2">
                <Crown className="h-4 w-4" />
                Перейти на Premium
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

