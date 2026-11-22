import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";

const companyLinks = [
  ["About","/about.html"],["Careers","/contact.html"],["Blog","/blog.html"],
  ["Press","/blog.html"],["Gift Cards","/packages.html"],["Magazine","/guides.html"]
];
const supportLinks = [
  ["Contact","/contact.html"],["Legal Notice","/terms.html"],["Privacy Policy","/privacy.html"],
  ["Terms and Conditions","/terms.html"],["Sitemap","/sitemap.xml"],["Cookie policy","/privacy.html"]
];

export default function SiteFooter() {
  return <>
    <footer className="site-footer footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <section className="site-footer-column">
            <h2>Get In Touch</h2>
            <p><MapPin size={16}/>80-D, 3rd Floor, Block-ED, Madhuban Chowk, Pitam Pura, New Delhi-110034</p>
            <a href="mailto:info@travelqila.com"><Mail size={16}/>info@travelqila.com</a>
            <a href="tel:+919871101345"><Phone size={16}/>+91 9871101345</a>
            <a href="tel:+919871101345"><Phone size={16}/>+91 9871101345</a>
            <div className="site-footer-socials" aria-label="Social channels">
              <span><Facebook size={16}/></span><span><Twitter size={16}/></span><span><Instagram size={16}/></span><span><Linkedin size={16}/></span>
            </div>
          </section>
          <section className="site-footer-column">
            <h2>Company</h2>
            {companyLinks.map(([label,href])=><Link key={label} href={href}>{label}</Link>)}
          </section>
          <section className="site-footer-column">
            <h2>Support</h2>
            {supportLinks.map(([label,href])=><Link key={label} href={href}>{label}</Link>)}
          </section>
          <section className="site-footer-column site-footer-preferences">
            <div className="site-footer-selects">
              <label>Language<select defaultValue="English"><option>English</option><option>Arabic</option><option>German</option><option>Greek</option></select></label>
              <label>Currency<select defaultValue="INR"><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label>
            </div>
            <h2>Payments</h2>
            <div className="site-payment-marks" aria-label="Payment methods accepted"><span>AMEX</span><span>VISA</span><span>MC</span><span>PayPal</span><span>DISCOVER</span></div>
          </section>
        </div>
      </div>
    </footer>
    <div className="site-copyright">
      <div><span>© <Link href="/">Travel Qila</Link>, All right reserved.</span><span>Designed By <a href="https://github.com/ImperialX1104" target="_blank" rel="noopener noreferrer">Imperial Technologies</a></span></div>
    </div>
    <a className="site-back-to-top" href="#top" aria-label="Back to top">↑</a>
  </>;
}
