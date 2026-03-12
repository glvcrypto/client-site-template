import { User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PublicLayout } from '@/components/public/public-layout'
import { usePageContent } from '@/hooks/use-content'
import { useActiveStaff } from '@/hooks/use-staff-directory'

const defaultBrands = [
  { name: 'Princecraft', desc: 'Canadian-built aluminium fishing and pontoon boats.' },
  { name: 'Mercury', desc: 'Industry-leading outboard motors and marine propulsion.' },
  { name: 'Cub Cadet', desc: 'Lawn tractors, zero-turns, and snow blowers.' },
  { name: 'Toro', desc: 'Professional-grade lawn mowers and landscaping equipment.' },
  { name: 'ECHO', desc: 'Chainsaws, trimmers, blowers, and outdoor power tools.' },
  { name: 'Minn Kota', desc: 'Trolling motors and anchoring systems.' },
  { name: 'Humminbird', desc: 'Fish finders and marine electronics.' },
  { name: 'E-Z-GO', desc: 'Golf carts and utility vehicles.' },
]

const defaultTeam = [
  { full_name: 'Casey', role_title: 'Owner / General Manager', photo_url: null },
  { full_name: 'Aaron', role_title: 'Sales Manager', photo_url: null },
  { full_name: 'Mike', role_title: 'Lead Service Technician', photo_url: null },
  { full_name: 'Lynn', role_title: 'Parts & Accessories', photo_url: null },
  { full_name: 'Ron', role_title: 'Marine Specialist', photo_url: null },
]

export function AboutPage() {
  const { data: content } = usePageContent('about')
  const { data: staffMembers } = useActiveStaff()

  // CMS content with fallbacks
  const heroTitle = content?.hero_title?.value ?? 'About Us'
  const storyHeading = content?.story_heading?.value ?? 'Our Story'
  const storyParagraph1 = content?.story_paragraph_1?.value ??
    'We started as a small marine dealership with a simple mission: give the people of Northern Ontario an honest, knowledgeable place to buy and service their boats. Over the years, that mission expanded as our customers asked us to do more. Today we are a full-service dealership covering marine, lawn and garden, and outdoor power equipment \u2014 all under one roof.'
  const storyParagraph2 = content?.story_paragraph_2?.value ??
    'As a family-owned business, we take pride in knowing our customers by name. When you walk through our doors, you will deal with the same faces from purchase to service to parts. That continuity is something the big-box stores simply cannot offer.'
  const storyParagraph3 = content?.story_paragraph_3?.value ??
    'Located in Sault Ste. Marie, we serve communities across the Algoma District and beyond. Whether you are rigging a fishing boat for Lake Superior, outfitting your cottage property, or keeping your driveway clear in January, our team has the expertise and inventory to get you set up right.'
  const teamHeading = content?.team_heading?.value ?? 'Meet the Team'
  const brandsHeading = content?.brands_heading?.value ?? 'Brands We Carry'

  // Use CMS staff directory if available, otherwise fallback
  const displayTeam = staffMembers && staffMembers.length > 0 ? staffMembers : defaultTeam

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-[#1B2A4A] px-4 py-16 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">{heroTitle}</h1>
      </section>

      {/* Our Story */}
      <section className="mx-auto max-w-4xl px-4 py-20 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-[#1B2A4A]">{storyHeading}</h2>
        <div className="space-y-4 leading-relaxed text-gray-700">
          {content?.story_body?.type === 'html' && content.story_body.value ? (
            <div dangerouslySetInnerHTML={{ __html: content.story_body.value }} />
          ) : (
            <>
              <p>{storyParagraph1}</p>
              <p>{storyParagraph2}</p>
              <p>{storyParagraph3}</p>
            </>
          )}
        </div>
      </section>

      {/* Team */}
      <section className="bg-gray-50 px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-[#1B2A4A]">{teamHeading}</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {displayTeam.map((member: any) => (
              <Card key={member.full_name} className="border border-gray-200 text-center">
                <CardContent className="flex flex-col items-center p-6">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-[#1B2A4A]">{member.full_name}</h3>
                  <p className="text-sm text-gray-600">{member.role_title ?? member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <h2 className="mb-10 text-center text-2xl font-bold text-[#1B2A4A]">{brandsHeading}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {defaultBrands.map((brand) => (
            <Card key={brand.name} className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="mb-1 text-base font-semibold text-[#1B2A4A]">{brand.name}</h3>
                <p className="text-sm text-gray-600">{brand.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  )
}
