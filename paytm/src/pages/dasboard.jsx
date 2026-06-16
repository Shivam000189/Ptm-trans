

export default function Dashboard() {
    return (
        <div className="h-screen w-screen flex flex-col">
            <div className="h-1/8 w-full border-b-1  flex items-center justify-between px-4 py-2">
                <h1 className="text-3xl font-bold text-center">Payments App</h1>

                <div className="flex items-center ">
                    <span className="text-lg font-semibold">Welcome, User!</span>
                    <span className="size-10 flex items-center justify-center text-lg font-semibold ml-4 cursor-pointer rounded-full bg-gray-400 text-white">U</span>
                </div>

            </div>



            <div className="flex items-center justify-start px-4 py-2">
                <h2 className="text-2xl font-bold text-center mt-8">Your Balance</h2>
                <p className="text-2xl font-bold mt-9 ml-3">₹10,000</p>
            </div>


            {/* // User Search and Transactions List */}
            <div>
                <h2 className="text-2xl font-bold text-center mt-8">Users Search</h2>
                <div className="flex items-center justify-center mt-4">
                    <input type="text" placeholder="Search users..." className="border-2 border-gray-300 rounded-md p-2 w-1/3" />
                    <button className="bg-black text-white rounded-md hover:opacity-80 p-2 ml-2 cursor-pointer">Search</button>
                </div>
                <h2 className="text-2xl font-bold text-center mt-8">User List</h2>
                <div className="flex flex-col items-center justify-center mt-4">
                    <div className="w-1/2 border-2 flex items-center justify-between border-gray-300 rounded-md p-4 mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">John Doe</h3>
                            <p>Email: john.doe@example.com</p>
                        </div>
                        <div className="mt-2">
                            <button className="bg-blue-500 text-white rounded-md hover:opacity-80 p-2 cursor-pointer">send money</button>
                        </div>
                    </div>
                    <div className="w-1/2 border-2 flex items-center justify-between border-gray-300 rounded-md p-4 mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">Jane Smith</h3>
                            <p>Email: jane.smith@example.com</p>
                        </div>
                        <div className="mt-2">
                            <button className="bg-blue-500 text-white rounded-md hover:opacity-80 p-2 cursor-pointer">send money</button>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    )
}