import os
_basedir = os.path.abspath(os.path.dirname(__file__))

DEBUG = False



THREADS_PER_PAGE = 2

# Enable protection agains *Cross-site Request Forgery (CSRF)*
CSRF_ENABLED     = True

# Use a secure, unique and absolutely secret key for
# signing the data. 
CSRF_SESSION_KEY = "secret"

# Secret key for signing cookies
SECRET_KEY = "c39dcb77e31b57bb094e816c4982ac3c"