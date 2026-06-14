
export default function Signup() {
    return (
        <div className="h-screen w-screen flex items-center justify-center">
            <div className="bg-white p-8 rounded-md shadow-md w-96 space-y-4"> 
                <h1 className="text-3xl font-bold text-center">Signup Page</h1>

                <form action="sumbit" className="flex flex-col items-center justify-center">
                    <input type="text" placeholder="Name" className="border-2 border-gray-300 rounded-md p-2 m-2" />
                    <input type="email" placeholder="Email" className="border-2 border-gray-300 rounded-md p-2 m-2" />
                    <input type="password" placeholder="Password" className="border-2 border-gray-300 rounded-md p-2 m-2" />
                    <button type="submit" className="bg-blue-500 text-white rounded-md hover:bg-blue-900 p-2 m-2 cursor-pointer">Signup</button>
                </form>
            
            </div>

            
        </div>
    )
}