const counters =
document.querySelectorAll('.counter');

counters.forEach(counter => {

  const updateCounter = () => {

    const target =
    +counter.getAttribute('data-target');

    const current =
    +counter.innerText.replace('+','').replace('k','');

    const increment =
    target / 100;

    if(current < target){

      counter.innerText =
      `${Math.ceil(current + increment)}`;

      setTimeout(updateCounter,30);

    }

    else{

      // ADD SYMBOLS

      if(target === 7){

        counter.innerText = '7+';

      }

      else if(target === 100){

        counter.innerText = '100+';

      }

      else if(target === 30){

        counter.innerText = '30k+';

      }
      else if(target === 10){

        counter.innerText = '10+';

      }

    }

  };

  updateCounter();

});
AOS.init({

  duration:1200,

  once:false,

  mirror:true

});

const applicationStatus =
new URLSearchParams(window.location.search).get('application');

if(applicationStatus){

  const statusMessage =
  applicationStatus === 'success'
    ? 'Application submitted successfully. We will review it soon.'
    : 'Something went wrong while submitting the application. Please try again.';

  document.querySelectorAll('.form-status').forEach(statusElement => {

    statusElement.textContent = statusMessage;
    statusElement.classList.toggle(
      'success',
      applicationStatus === 'success'
    );
    statusElement.classList.toggle(
      'error',
      applicationStatus !== 'success'
    );

  });

}