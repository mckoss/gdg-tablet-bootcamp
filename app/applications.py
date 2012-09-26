from includes import App

# Define different javascript "apps" here.

COMMON_SCRIPTS = ('jquery', 'namespace-plus', 'app-cache', 'underscore', 'signin')

App('main',
    scripts=COMMON_SCRIPTS,
    styles=('bootstrap', 'admin', 'bootstrap-responsive', 'signin')
    )

App('admin',
    scripts=COMMON_SCRIPTS + ('bootstrap', 'image-gui', 'json-forms', 'json-rest', 'showdown'),
    styles=('bootstrap', 'bootstrap-responsive', 'forms', 'thumbnail-display', 'media-upload',
            'admin', 'signin'),
    images=('arrow-back.png', 'arrow-fwd.png', 'delete.png', 'plus-big.png')
    )

App('todos',
    scripts=COMMON_SCRIPTS + ('json-rest', 'backbone', 'todos'),
    styles=('todos', 'signin'),
    images=('destroy.png',)
    )

App('canvas',
    scripts=COMMON_SCRIPTS + ('bootstrap-colorpicker', 'modernizr-touch-only', 'canvas'),
    styles=('bootstrap', 'colorpicker', 'canvas', 'signin'),
    images=('alpha.png','hue.png','saturation.png')
    )
