'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/shared/animated-section';

const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  inquiryType: z.enum(['painting', 'select']),
  projectDescription: z
    .string()
    .min(20, 'Please describe your project in at least 20 characters'),
  address: z.string().optional(),
  timeline: z.string().optional(),
  budget: z.string().optional(),
  howDidYouHear: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      inquiryType: 'painting',
    },
  });

  const inquiryType = watch('inquiryType');

  const onSubmit = async (_data: ContactFormData) => {
    // Future: POST to API route -> database + email notification
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AnimatedSection className="text-center py-16">
        <h3 className="font-serif text-3xl font-bold text-charcoal">
          Thank You
        </h3>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate">
          We have received your inquiry and will be in touch within one
          business day. We look forward to learning about your project.
        </p>
      </AnimatedSection>
    );
  }

  const inputClasses = cn(
    'w-full border border-charcoal/15 bg-white px-4 py-3',
    'font-sans text-sm text-charcoal placeholder:text-slate-light',
    'transition-colors focus:border-gold focus:outline-none'
  );

  const labelClasses =
    'block font-sans text-xs font-semibold uppercase tracking-wider text-charcoal mb-2';

  const errorClasses = 'mt-1 text-xs text-red-600';

  return (
    <AnimatedSection>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Inquiry Type Toggle */}
        <div>
          <p className={labelClasses}>I&apos;m interested in</p>
          <div className="flex gap-0">
            <button
              type="button"
              onClick={() =>
                // react-hook-form setValue via register workaround
                document
                  .querySelector<HTMLInputElement>(
                    'input[value="painting"]'
                  )
                  ?.click()
              }
              className="sr-only"
            />
            <label
              className={cn(
                'flex-1 cursor-pointer px-6 py-3 text-center font-sans text-sm',
                'font-medium uppercase tracking-wider transition-all',
                inquiryType === 'painting'
                  ? 'bg-charcoal text-warm-white'
                  : 'bg-white text-slate border border-charcoal/15 hover:text-charcoal'
              )}
            >
              <input
                type="radio"
                value="painting"
                {...register('inquiryType')}
                className="sr-only"
              />
              Painting Services
            </label>
            <label
              className={cn(
                'flex-1 cursor-pointer px-6 py-3 text-center font-sans text-sm',
                'font-medium uppercase tracking-wider transition-all',
                inquiryType === 'select'
                  ? 'bg-charcoal text-warm-white'
                  : 'bg-white text-slate border border-charcoal/15 hover:text-charcoal'
              )}
            >
              <input
                type="radio"
                value="select"
                {...register('inquiryType')}
                className="sr-only"
              />
              Select Project Inquiry
            </label>
          </div>
        </div>

        {/* Name & Email */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelClasses}>
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              className={inputClasses}
              {...register('name')}
            />
            {errors.name && (
              <p className={errorClasses}>{errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className={labelClasses}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              className={inputClasses}
              {...register('email')}
            />
            {errors.email && (
              <p className={errorClasses}>{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Phone & Address */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="phone" className={labelClasses}>
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              className={inputClasses}
              {...register('phone')}
            />
            {errors.phone && (
              <p className={errorClasses}>{errors.phone.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="address" className={labelClasses}>
              Property Address{' '}
              <span className="text-slate-light">(optional)</span>
            </label>
            <input
              id="address"
              type="text"
              placeholder="123 Main St, Austin, TX"
              className={inputClasses}
              {...register('address')}
            />
          </div>
        </div>

        {/* Conditional fields for Select projects */}
        {inquiryType === 'select' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="timeline" className={labelClasses}>
                Desired Timeline{' '}
                <span className="text-slate-light">(optional)</span>
              </label>
              <select
                id="timeline"
                className={inputClasses}
                {...register('timeline')}
              >
                <option value="">Select a timeline</option>
                <option value="1-3 months">1-3 months</option>
                <option value="3-6 months">3-6 months</option>
                <option value="6-12 months">6-12 months</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div>
              <label htmlFor="budget" className={labelClasses}>
                Investment Range{' '}
                <span className="text-slate-light">(optional)</span>
              </label>
              <select
                id="budget"
                className={inputClasses}
                {...register('budget')}
              >
                <option value="">Select a range</option>
                <option value="100k-150k">$100,000 - $150,000</option>
                <option value="150k-250k">$150,000 - $250,000</option>
                <option value="250k-500k">$250,000 - $500,000</option>
                <option value="500k+">$500,000+</option>
              </select>
            </div>
          </div>
        )}

        {/* Project Description */}
        <div>
          <label htmlFor="projectDescription" className={labelClasses}>
            {inquiryType === 'painting'
              ? 'Tell Us About Your Project'
              : 'Describe Your Vision'}
          </label>
          <textarea
            id="projectDescription"
            rows={5}
            placeholder={
              inquiryType === 'painting'
                ? 'What rooms need painting? Any specific finishes or colors in mind?'
                : 'Tell us about your home, the scope of work you envision, and what matters most to you in the process.'
            }
            className={inputClasses}
            {...register('projectDescription')}
          />
          {errors.projectDescription && (
            <p className={errorClasses}>
              {errors.projectDescription.message}
            </p>
          )}
        </div>

        {/* How did you hear */}
        <div>
          <label htmlFor="howDidYouHear" className={labelClasses}>
            How did you hear about us?{' '}
            <span className="text-slate-light">(optional)</span>
          </label>
          <input
            id="howDidYouHear"
            type="text"
            placeholder="Referral, Google, Instagram, etc."
            className={inputClasses}
            {...register('howDidYouHear')}
          />
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Submit Inquiry'}
        </Button>
      </form>
    </AnimatedSection>
  );
}
