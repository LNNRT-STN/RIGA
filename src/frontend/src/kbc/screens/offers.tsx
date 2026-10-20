import {
  Bike,
  Building2,
  CarFront,
  CreditCard,
  Earth,
  FileBadge,
  FileText,
  Flower2,
  HandCoins,
  HandHeart,
  House,
  IdCard,
  Leaf,
  Lightbulb,
  Mail,
  Newspaper,
  PiggyBank,
  ShieldCheck,
  Signpost,
  Smartphone,
  Sparkle,
  Stethoscope,
  Ticket,
  Vault,
  Wallet,
  Wind,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TabPage } from '../layout'
import { useApp } from '../store'
import { Artwork, HScroll, MoreDots, PillButton, PromoCard, SectionHeader, Tile } from '../ui'

type TileSpec = { label: string; icon: LucideIcon; badge?: string; art?: 'square'; color?: string; iconColor?: string }

const groups: { title: string; tiles: TileSpec[] }[] = [
  {
    title: 'Mobility',
    tiles: [
      { label: 'Vignettes', icon: Signpost, badge: 'New' },
      { label: 'Get your driving licence', icon: IdCard },
      { label: 'Practise for your licence', icon: FileBadge },
      { label: 'Shared bikes', icon: Bike },
    ],
  },
  {
    title: 'Home & energy',
    tiles: [
      { label: 'Home maintenance', icon: Wrench, badge: 'New' },
      { label: 'Group energy purchase', icon: Wind },
      { label: 'Certificates and inspections', icon: FileText },
      { label: 'Renovation quotes', icon: House },
    ],
  },
  { title: 'Leisure', tiles: [{ label: 'Financial news', icon: Newspaper }] },
  {
    title: 'Telecom',
    tiles: [
      { label: 'eSIM for travellers', icon: Earth, art: 'square', color: 'bg-[#e8f86a] text-kbc-ink' },
      { label: 'Prepaid top-up', icon: Smartphone },
      { label: 'Mobile plans', icon: Sparkle },
    ],
  },
  {
    title: 'Payment services',
    tiles: [
      { label: 'Kate Wallet', icon: Wallet, badge: 'New' },
      { label: 'Guardian angel', icon: ShieldCheck, badge: 'New' },
      { label: 'Pay by phone', icon: Smartphone, art: 'square', color: 'bg-[#fff27a] text-kbc-ink' },
      { label: 'Pay invoices', icon: FileText },
    ],
  },
  {
    title: 'Health',
    tiles: [
      { label: 'Health coach', icon: HandHeart, badge: 'New' },
      { label: 'Your medical data', icon: Stethoscope },
    ],
  },
  {
    title: 'Cera & KBC',
    tiles: [
      { label: 'Cera', icon: Leaf },
      { label: 'Working at KBC', icon: Building2 },
    ],
  },
  {
    title: 'Administration',
    tiles: [
      { label: 'Digital vault', icon: Vault },
      { label: 'eBox', icon: Mail },
      { label: 'Registered email', icon: FileBadge, art: 'square', color: 'bg-[#1e4d3f] text-white' },
    ],
  },
  {
    title: 'Good causes',
    tiles: [
      { label: 'Charity week', icon: HandHeart, badge: 'New' },
      { label: 'Fight against cancer', icon: Flower2, iconColor: 'text-kbc-yellow' },
    ],
  },
]

const coinOffers: { brand: string; reward: string; tint: 'blue' | 'green' | 'sand' | 'navy'; icon: LucideIcon; badge?: string }[] = [
  { brand: 'Supermarket', reward: 'Discover reward', tint: 'sand', icon: Wallet },
  { brand: 'Shoe store', reward: '+20.00 KTC', tint: 'green', icon: Ticket },
  { brand: 'Test drive', reward: '+15.00 KTC', tint: 'navy', icon: CarFront, badge: 'New' },
  { brand: 'Car wash', reward: '+2.00 KTC', tint: 'blue', icon: Sparkle, badge: 'New' },
]

export function OffersScreen() {
  const { push } = useApp()
  return (
    <TabPage title="Offers" katePrompt="Buy a train ticket?">
      <SectionHeader title="Your favourites" strong className="pt-6" />
      <div className="flex items-center justify-between px-4 pb-6">
        <span className="grid size-[58px] place-items-center rounded-[12px] bg-[#ffe75a] text-kbc-navy">
          <Ticket className="size-7" strokeWidth={1.5} />
        </span>
        <MoreDots className="self-start text-kbc-navy" label="Edit favourites" />
      </div>

      <PromoCard text="Get up to €750 off your home insulation with our partner." cta="Request a quote" icon={House} tint="sand" />

      <SectionHeader title="KBC products" strong />
      <HScroll>
        <Tile icon={Wallet} label="Accounts" />
        <Tile icon={CreditCard} label="Payment methods" />
        <Tile icon={PiggyBank} label="Saving and investing" />
        <Tile icon={HandCoins} label="Borrowing" />
        <Tile icon={ShieldCheck} label="Insurance" />
      </HScroll>

      <SectionHeader title="Themes" action="Show all" strong className="pt-5" />
      <HScroll>
        <Tile label="MyMobility" art={<ThemeIcon icon={Signpost} className="bg-[linear-gradient(135deg,#2a5e9c,#5a8ccc)]" />} />
        <Tile label="MyHome" art={<ThemeIcon icon={House} className="bg-[linear-gradient(135deg,#3b8fd3,#2a5e9c)]" />} />
        <Tile label="Together more sustainable" art={<ThemeIcon icon={Leaf} className="bg-kbc-lime" />} />
        <Tile label="Your money at a glance" art={<ThemeIcon icon={Lightbulb} className="bg-kbc-yellow" />} />
      </HScroll>

      <SectionHeader title="Earn Kate Coins here" action="Show all" strong className="pt-5" />
      <HScroll>
        {coinOffers.map((o) => (
          <button
            key={o.brand}
            type="button"
            onClick={() => push({ name: 'kate', prompt: `How do I earn Kate Coins with the ${o.brand.toLowerCase()} offer?` })}
            className="relative h-[160px] w-[100px] shrink-0 snap-start overflow-hidden rounded-[12px] text-left shadow-[0_2px_10px_rgba(20,41,77,0.1)]"
          >
            <Artwork icon={o.icon} tint={o.tint} className="h-[98px] w-full" />
            <span className="absolute inset-x-0 bottom-0 flex h-[62px] flex-col justify-center bg-[#4a5568]/85 px-2 text-white backdrop-blur">
              <span className="text-[12.5px] leading-tight">{o.brand}</span>
              <span className="text-[13.5px] font-bold">{o.reward}</span>
            </span>
            {o.badge && (
              <span className="absolute top-0 right-2 rounded-b-[5px] bg-kbc-green px-2 py-[2px] text-[11.5px] font-semibold text-white">
                {o.badge}
              </span>
            )}
          </button>
        ))}
      </HScroll>

      {groups.map((g) => (
        <div key={g.title}>
          <SectionHeader title={g.title} action={g.tiles.length > 3 ? 'Show all' : undefined} strong className="pt-5" />
          <HScroll>
            {g.tiles.map((t) => (
              <Tile
                key={t.label}
                label={t.label}
                badge={t.badge}
                icon={t.icon}
                iconClassName={t.iconColor}
                art={
                  t.art === 'square' ? (
                    <span className={cn('grid size-[42px] place-items-center rounded-[10px]', t.color)}>
                      <t.icon className="size-6" strokeWidth={1.6} />
                    </span>
                  ) : undefined
                }
              />
            ))}
          </HScroll>
        </div>
      ))}

      <div className="mt-8 px-4">
        <div className="flex gap-4">
          <Lightbulb className="size-[42px] shrink-0 text-kbc-navy" strokeWidth={1.2} />
          <p className="text-[20px] leading-[1.25] font-extrabold text-kbc-navy">Discover handy tips and tricks in KBC Mobile</p>
        </div>
        <p className="mt-3 text-[16.5px] leading-[1.35] text-kbc-navy">
          Are you getting the most out of our app? Use KBC Mobile like a pro.
        </p>
        <PillButton className="mt-4" onClick={() => push({ name: 'kate', prompt: 'What can you do?' })}>
          Get started
        </PillButton>
      </div>
    </TabPage>
  )
}

function ThemeIcon({ icon: Icon, className }: { icon: LucideIcon; className: string }) {
  return (
    <span className={cn('grid size-[46px] place-items-center rounded-[10px] text-white', className)}>
      <Icon className="size-6" strokeWidth={1.8} />
    </span>
  )
}
