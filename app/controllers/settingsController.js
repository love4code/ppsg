const Settings = require('../models/Settings');

exports.index = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const Media = require('../models/Media');
    const media = await Media.find().sort({ createdAt: -1 }).limit(50);
    
    // Populate background image if it exists
    if (settings.hero && settings.hero.backgroundImage) {
      await settings.populate('hero.backgroundImage');
    }
    
    res.render('admin/settings/index', { 
      settings,
      media: media || [],
      activePage: 'settings',
    });
  } catch (error) {
    console.error('Settings error:', error);
    req.session.error = 'Error loading settings';
    res.redirect('/admin');
  }
};

exports.update = async (req, res) => {
  try {
    const { theme, customColors, hero } = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    settings.theme = theme || 'default';
    
    if (customColors) {
      settings.customColors = {
        primary: customColors.primary || settings.customColors.primary,
        secondary: customColors.secondary || settings.customColors.secondary,
        success: customColors.success || settings.customColors.success,
        danger: customColors.danger || settings.customColors.danger,
        warning: customColors.warning || settings.customColors.warning,
        info: customColors.info || settings.customColors.info,
      };
    }
    
    if (hero) {
      settings.hero = {
        enabled: hero.enabled === 'on' || hero.enabled === true,
        title: hero.title || settings.hero?.title || 'Welcome to PPSG',
        subtitle: hero.subtitle || settings.hero?.subtitle || '',
        buttonText: hero.buttonText || settings.hero?.buttonText || 'Get in Touch',
        buttonLink: hero.buttonLink || settings.hero?.buttonLink || '/contact',
        textColor: hero.textColor || settings.hero?.textColor || '#ffffff',
        backgroundImage: hero.backgroundImage || settings.hero?.backgroundImage || undefined,
        overlayOpacity: parseFloat(hero.overlayOpacity) || settings.hero?.overlayOpacity || 0.5,
        height: hero.height || settings.hero?.height || 'medium',
      };
    }
    
    await settings.save();
    
    req.session.success = 'Settings updated successfully';
    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Settings update error:', error);
    req.session.error = 'Error updating settings';
    res.redirect('/admin/settings');
  }
};

// API endpoint to get theme CSS
exports.getThemeCSS = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const css = generateThemeCSS(settings);
    res.set('Content-Type', 'text/css');
    res.send(css);
  } catch (error) {
    console.error('Theme CSS error:', error);
    res.status(500).send('/* Error loading theme */');
  }
};

function generateThemeCSS(settings) {
  const themes = {
    default: {
      primary: '#0d6efd',
      secondary: '#6c757d',
      success: '#198754',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#0dcaf0',
    },
    ocean: {
      primary: '#0066cc',
      secondary: '#4a90e2',
      success: '#00a86b',
      danger: '#e63946',
      warning: '#ffb347',
      info: '#00ced1',
    },
    sky: {
      primary: '#007bff',
      secondary: '#5dade2',
      success: '#28a745',
      danger: '#e74c3c',
      warning: '#f39c12',
      info: '#17a2b8',
    },
    navy: {
      primary: '#001f3f',
      secondary: '#2c3e50',
      success: '#27ae60',
      danger: '#c0392b',
      warning: '#f1c40f',
      info: '#3498db',
    },
    royal: {
      primary: '#4169e1',
      secondary: '#6a5acd',
      success: '#32cd32',
      danger: '#ff4500',
      warning: '#ffd700',
      info: '#1e90ff',
    },
    teal: {
      primary: '#008080',
      secondary: '#20b2aa',
      success: '#2ecc71',
      danger: '#e74c3c',
      warning: '#f39c12',
      info: '#1abc9c',
    },
  };
  
  let colors;
  if (settings.theme === 'custom') {
    colors = settings.customColors;
  } else {
    colors = themes[settings.theme] || themes.default;
  }
  
  return `
    :root {
      --bs-primary: ${colors.primary};
      --bs-secondary: ${colors.secondary};
      --bs-success: ${colors.success};
      --bs-danger: ${colors.danger};
      --bs-warning: ${colors.warning};
      --bs-info: ${colors.info};
    }
    
    .btn-primary {
      background-color: ${colors.primary};
      border-color: ${colors.primary};
    }
    
    .btn-primary:hover {
      background-color: ${darkenColor(colors.primary, 10)};
      border-color: ${darkenColor(colors.primary, 10)};
    }
    
    .text-primary {
      color: ${colors.primary} !important;
    }
    
    .bg-primary {
      background-color: ${colors.primary} !important;
    }
    
    .border-primary {
      border-color: ${colors.primary} !important;
    }
    
    .admin-sidebar {
      background: linear-gradient(135deg, ${colors.primary} 0%, ${darkenColor(colors.primary, 20)} 100%);
    }
    
    a {
      color: ${colors.primary};
    }
    
    a:hover {
      color: ${darkenColor(colors.primary, 15)};
    }
  `;
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + -amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + -amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + -amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

