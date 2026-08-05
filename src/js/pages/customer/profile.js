
import {getCurrentUser} from '../../api/auth.js'

const user = await getCurrentUser()

console.log(user)
