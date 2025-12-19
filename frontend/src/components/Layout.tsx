import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface Props {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/volumes', label: 'Volume Manager' },
  { path: '/policies', label: 'Policies' },
  { path: '/onboarding', label: 'Onboarding' },
];

export default function Layout({ children }: Props) {
  const location = useLocation();
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">CloudShrink</div>
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.path}
              className={location.pathname === item.path ? 'active' : ''}
              to={item.path}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
