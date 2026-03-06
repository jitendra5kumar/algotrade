import AboutUsSection from "../components/AboutUs";
import FaqsSection from "../components/FaqsSection";
import FooterSection from "../components/FooterSection";
import Header from "../components/Header";
import AlgotradeHero from "../components/heroPage";
import PricingSection from "../components/PricingSection";
import TestimonialSection from "../components/TestimonialSection";

export default function Home() {
	return (
		<main>
			<Header />
			<AlgotradeHero />
			<section id="about">
				<AboutUsSection />
			</section>
			<section id="testimonials">
				<TestimonialSection />
			</section>
			<section id="pricing">
				<PricingSection />
			</section>
			<section id="faq">
				<FaqsSection />
			</section>
			<FooterSection />
		</main>
	);
}
