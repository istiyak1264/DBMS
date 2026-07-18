import React from 'react'
import { 
  FaHeart, 
  FaGithub, 
  FaTwitter, 
  FaLinkedin,
  FaEnvelope,
  FaCode
} from 'react-icons/fa'
import styles from './Footer.module.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerContent}>
          {/* Left Section */}
          <div className={styles.footerLeft}>
            <div className={styles.footerBrand}>
              <div className={styles.brandIcon}>
                <FaCode />
              </div>
              <div className={styles.brandText}>
                <span className={styles.brandName}>Mess Manager</span>
                <span className={styles.brandSub}>v1.0.0</span>
              </div>
            </div>
            <p className={styles.footerDescription}>
              Complete mess management solution for hostels, 
              canteens, and dining halls. Made with 
              <FaHeart className={styles.heartIcon} /> for better management.
            </p>
          </div>

          {/* Center Section - Links */}
          <div className={styles.footerCenter}>
            <div className={styles.footerLinks}>
              <a href="#" className={styles.footerLink}>Privacy Policy</a>
              <a href="#" className={styles.footerLink}>Terms of Service</a>
              <a href="#" className={styles.footerLink}>Help Center</a>
              <a href="#" className={styles.footerLink}>Contact Us</a>
            </div>
          </div>

          {/* Right Section - Social */}
          <div className={styles.footerRight}>
            <div className={styles.socialLinks}>
              <a 
                href="#" 
                className={styles.socialLink}
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub />
              </a>
              <a 
                href="#" 
                className={styles.socialLink}
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaTwitter />
              </a>
              <a 
                href="#" 
                className={styles.socialLink}
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin />
              </a>
              <a 
                href="#" 
                className={styles.socialLink}
                aria-label="Email"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaEnvelope />
              </a>
            </div>
            
            <div className={styles.footerStatus}>
              <span className={styles.statusDot}></span>
              <span className={styles.statusText}>All systems operational</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.footerBottom}>
          <div className={styles.bottomLeft}>
            <span className={styles.copyright}>
              &copy; {currentYear} Mess Manager. All rights reserved.
            </span>
          </div>
          <div className={styles.bottomRight}>
            <span className={styles.buildInfo}>
              Built with React & Flask
            </span>
            <span className={styles.separator}>•</span>
            <span className={styles.versionInfo}>
              Version 1.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer