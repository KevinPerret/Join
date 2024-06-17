// const BASE_URL = "https://join-230-default-rtdb.europe-west1.firebasedatabase.app/";
const BASE_URL = "https://join-database-6441e-default-rtdb.europe-west1.firebasedatabase.app/";

let mycontacts = [];
let highestId = 0;

function initContacts() {
    includeHTML().then(() => {highlightContacts()});
    readData().then(() => {
        updateHeaderProfileInitials();
        renderContacts();
    });
}

async function loadData(path = "") {
    let response = await fetch(BASE_URL + path + ".json");
    let responseToJson = await response.json();
    return responseToJson;
}

async function readData() {
    try {
        const contactsData = await loadData("/contacts");
        if (contactsData) {
            // Convert the retrieved object into an array and filter null values
            mycontacts = filterNullValues(Object.values(contactsData));

            // Determine the highest ID among the existing contacts
            highestId = mycontacts.reduce((maxId, contact) => Math.max(maxId, contact.id), 0);

            console.log('Contacts retrieved from database:', mycontacts);
        } else {
            console.log('No contacts found in the database.');
        }
    } catch (error) {
        console.error('Error loading contacts data:', error);
    }
}


async function renderContacts() {
    try {
        // Check if contacts array is empty
        if (mycontacts.length === 0) {
            const contactsListContainer = document.getElementById('contacts-list');
            contactsListContainer.innerHTML = '<p class="no-contacts">No contacts</p>';
            return;
        }

        // Sort the contacts by name
        const sortedContacts = mycontacts.sort((a, b) => a.name.localeCompare(b.name));

        // Render contacts
        const contactsListContainer = document.getElementById('contacts-list');
        contactsListContainer.innerHTML = '';
        let currentLetter = '';

        sortedContacts.forEach((contact) => {
            const firstLetter = contact.name.charAt(0).toUpperCase();
            if (firstLetter !== currentLetter) {
                currentLetter = firstLetter;
                contactsListContainer.innerHTML += contactsSeparatorHtml(currentLetter);
            }
            contactsListContainer.innerHTML += contactsListHtml(contact);
        });
    } catch (error) {
        console.error('Error rendering contacts:', error);
    }
}


function slideContact(container) {
    container.style.transform = 'translateX(100%)';
    container.style.opacity = '0';
    setTimeout(() => {
        container.style.transform = 'translateX(0)';
        container.style.opacity = '1';
    }, 75);
}

function selectedContact(id) {
    document.querySelectorAll('.contact').forEach(contactElement => {
        contactElement.classList.remove('contact-selected');
    });
    const selectedContactElement = document.getElementById(`${id}`);
    if (selectedContactElement) {
        selectedContactElement.classList.add('contact-selected');
    }
}

function filterNullValues(array) {
    return array.filter(item => item !== null);
}

async function displayContact(id) {
    try {
        const contact = mycontacts.find(contact => contact.id === id);
        if (contact) {
            const contactDetailsContainer = document.getElementById('contact-displayed');
            contactDetailsContainer.innerHTML = displayContactHtml(contact);
            selectedContact(id);
            slideContact(contactDetailsContainer);
        } else {
            console.error(`Contact with ID ${id} not found.`);
        }
    } catch (error) {
        console.error('Error displaying contact:', error);
    }
}

function slideToastMsg() {
    let container = document.getElementById('contact-created')
    container.style.transform = 'translateX(2000%)';
    setTimeout(() => {
        container.style.transform = 'translateX(0)';
    }, 500);
    setTimeout(() => {
        container.style.transform = 'translateX(2000%)';
    }, 2000);

}





async function addContact() {
    try {
        const name = document.getElementById('new-name').value;
        const email = document.getElementById('new-email').value;
        const phone = document.getElementById('new-phone').value;
        const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();

        // Increment highestId for the new contact
        highestId += 1;
        console.log(highestId);
        // Create a new contact object
        const newContact = {
            id: highestId,
            name: name,
            email: email,
            phone: phone,
            color: randomColors(),
            initials: initials,
        };

        // Add the new contact to the array
        mycontacts.push(newContact);

        // Save the new contact to the database
        await fetch(`${BASE_URL}/contacts/${newContact.id}.json`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newContact)
        });

        // Reload contacts and update the UI
        await renderContacts();
        await displayContact(newContact.id);
        closePopUpWindow('add-contact');
        scrollToContact(newContact.id);
        slideToastMsg();
    } catch (error) {
        console.error('Error adding contact:', error);
    }
}



function editContact(id) {
    // Find the contact by ID
    const contact = mycontacts.find(contact => contact.id === id);
    if (!contact) return;
    const editContactContainer = document.getElementById('edit-contact');
    editContactContainer.innerHTML = editContactHtml(contact);

    // Open the pop-up window
    openPopUpWindow('edit-contact');
}

async function updateContact(id) {
    try {
        // Get the updated values from the form
        const name = document.getElementById('edit-name').value;
        const email = document.getElementById('edit-email').value;
        const phone = document.getElementById('edit-phone').value;
        const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();

        // Find the contact in the array
        const contact = mycontacts.find(contact => contact.id === id);
        if (!contact) return;

        // Update the contact details locally
        contact.name = name;
        contact.email = email;
        contact.phone = phone;
        contact.initials = initials;

        // Create an object with only the updated fields
        const updatedFields = {
            name: name,
            email: email,
            phone: phone,
            initials: initials
        };

        // Save the updated contact fields to the database using PATCH
        await fetch(`${BASE_URL}/contacts/${id}.json`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedFields)
        });

        // Reload contacts and update the UI
        await renderContacts();
        await displayContact(id);
        closePopUpWindow('edit-contact');
    } catch (error) {
        console.error('Error updating contact:', error);
    }
}

async function deleteContact(id) {
    try {
        // Remove the contact from the array
        mycontacts = mycontacts.filter(contact => contact.id !== id);

        // Hide the contact display container
        const container = document.getElementById('contact-displayed');
        container.style.transform = 'translateX(100%)';
        container.style.opacity = '0';



        // Clear the content of the contact display container
        setTimeout(() => {
            container.innerHTML = '';
        }, 75);

        closePopUpWindow('edit-contact')

        // Send a DELETE request to remove the contact from the server
        await fetch(`${BASE_URL}/contacts/${id}.json`, {
            method: 'DELETE'
        });

        // Reload the contact list by rendering contacts again
        await renderContacts();
    } catch (error) {
        console.error('Error deleting contact:', error);
    }
}


function scrollToContact(id) {
    const contactsContainer = document.querySelector('.contacts-container');
    const contactElement = document.getElementById(`${id}`);
    if (contactElement && contactsContainer) {
        const contactRect = contactElement.getBoundingClientRect();
        const containerRect = contactsContainer.getBoundingClientRect();
        const contactTopRelativeToContainer = contactRect.top - containerRect.top;
        const contactBottomRelativeToContainer = contactTopRelativeToContainer + contactRect.height;
        const containerHeight = containerRect.height;
        const offsetFromBottom = 14;

        if (contactTopRelativeToContainer < 0) {
            contactsContainer.scrollTo({ top: contactsContainer.scrollTop + contactTopRelativeToContainer, behavior: 'smooth' });
        } else if (contactBottomRelativeToContainer > containerHeight) {
            contactsContainer.scrollTo({ top: contactsContainer.scrollTop + (contactBottomRelativeToContainer - containerHeight) + offsetFromBottom, behavior: 'smooth' });
        } else {
            const offset = (containerHeight - contactRect.height) / 2;
            contactsContainer.scrollTo({ top: contactTopRelativeToContainer - offset, behavior: 'smooth' });
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const inputs = document.querySelectorAll('.input input');

    inputs.forEach(function (input) {
        const container = input.parentElement;

        input.addEventListener('focus', function () {
            container.classList.add('input-active');
        });

        input.addEventListener('blur', function () {
            container.classList.remove('input-active');
        });

        input.addEventListener('input', function () {
            container.classList.add('input-active');
        });
    });
});

function openPopUpWindow(windowId) {
    let popUpWindow = document.getElementById(windowId);
    let modal = document.getElementById('modal');
    modal.classList.remove('d-none');
    popUpWindow.classList.remove('d-none');
    setTimeout(() => {
        popUpWindow.classList.remove('pop-up-close');
        popUpWindow.classList.add('pop-up-open');
    }, 10);
}

function closePopUpWindow(windowId) {
    let popUpWindow = document.getElementById(windowId);
    let modal = document.getElementById('modal');
    popUpWindow.classList.remove('pop-up-open');
    popUpWindow.classList.add('pop-up-close');
    setTimeout(() => {
        modal.classList.add('d-none');
        popUpWindow.classList.add('d-none');
    }, 110);
    clearInputs();

}



function clearInputs() {
    const inputs = document.querySelectorAll('.input input');
    inputs.forEach(function (input) {
        input.value = '';
    });
}

function randomColors() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
function closeModalOnClick(event) {
    const modal = document.getElementById('modal');
    const addContactContent = document.getElementById('add-contact');
    const editContactContent = document.getElementById('edit-contact');

    if (event.target === modal) {
        if (!addContactContent.classList.contains('d-none')) {
            closePopUpWindow('add-contact');
        }
        if (!editContactContent.classList.contains('d-none')) {
            closePopUpWindow('edit-contact');
        }
    }
}

function openContactSubMenu() {
    let subMenu = document.getElementById('contact-sub-menu');
    let subModal = document.getElementById('contact-sub-menu-modal');
    subModal.classList.remove('d-none');
    subMenu.classList.remove('d-none');
    setTimeout(() => {
        subMenu.classList.remove('sub-menu-close');
        subMenu.classList.add('sub-menu-open');
    }, 10);

}
function closeContactSubMenu() {
    let subMenu = document.getElementById('contact-sub-menu');
    let subModal = document.getElementById('contact-sub-menu-modal');
    subMenu.classList.remove('sub-menu-open');
    subMenu.classList.add('sub-menu-close');
    setTimeout(() => {
        subModal.classList.add('d-none');
        subMenu.classList.add('d-none');
    }, 100);
}

window.onclick = function (event) {
    const subMenu = document.getElementById('sub-menu-modal');
    if (event.target === subMenu) {
        closeContactSubMenu() ;
    }
}


window.addEventListener('click', closeModalOnClick);




